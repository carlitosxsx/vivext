
-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('ong', 'voluntario');

-- Enum para status de ação
CREATE TYPE public.acao_status AS ENUM ('ativa', 'concluida', 'rascunho');

-- Enum para status de inscrição
CREATE TYPE public.inscricao_status AS ENUM ('pendente', 'aprovado', 'recusado');

-- Tabela de perfis (dados comuns a todos os usuários autenticados)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  cidade TEXT,
  estado TEXT,
  telefone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Tabela de ONGs (dados específicos da organização)
CREATE TABLE public.ongs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT '',
  cidade TEXT NOT NULL DEFAULT '',
  estado TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  telefone TEXT NOT NULL DEFAULT '',
  site TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de voluntários (dados específicos do voluntário)
CREATE TABLE public.voluntarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  habilidades TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de ações voluntárias
CREATE TABLE public.acoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ong_id UUID NOT NULL REFERENCES public.ongs(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT NOT NULL DEFAULT '',
  data DATE NOT NULL,
  local TEXT NOT NULL DEFAULT '',
  categoria TEXT NOT NULL DEFAULT '',
  vagas_total INTEGER NOT NULL DEFAULT 0,
  status acao_status NOT NULL DEFAULT 'rascunho',
  imagem_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de inscrições de voluntários em ações
CREATE TABLE public.inscricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  acao_id UUID NOT NULL REFERENCES public.acoes(id) ON DELETE CASCADE,
  voluntario_id UUID NOT NULL REFERENCES public.voluntarios(id) ON DELETE CASCADE,
  status inscricao_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (acao_id, voluntario_id)
);

-- Função security definer para checar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil no signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ongs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.voluntarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inscricoes ENABLE ROW LEVEL SECURITY;

-- Profiles: usuário lê/edita próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles: usuário vê próprio role
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own role" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ONGs: leitura pública, escrita pelo dono
CREATE POLICY "Anyone can view ongs" ON public.ongs FOR SELECT USING (true);
CREATE POLICY "ONG owner can insert" ON public.ongs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ONG owner can update" ON public.ongs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "ONG owner can delete" ON public.ongs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Voluntários: leitura por autenticados, escrita pelo dono
CREATE POLICY "Authenticated can view voluntarios" ON public.voluntarios FOR SELECT TO authenticated USING (true);
CREATE POLICY "Voluntario owner can insert" ON public.voluntarios FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Voluntario owner can update" ON public.voluntarios FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Ações: leitura pública, escrita pela ONG dona
CREATE POLICY "Anyone can view acoes" ON public.acoes FOR SELECT USING (true);
CREATE POLICY "ONG can insert acoes" ON public.acoes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.ongs WHERE id = ong_id AND user_id = auth.uid())
);
CREATE POLICY "ONG can update acoes" ON public.acoes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ongs WHERE id = ong_id AND user_id = auth.uid())
);
CREATE POLICY "ONG can delete acoes" ON public.acoes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.ongs WHERE id = ong_id AND user_id = auth.uid())
);

-- Inscrições: voluntário inscreve/remove, ONG da ação pode ver e atualizar status
CREATE POLICY "Voluntario can view own inscricoes" ON public.inscricoes FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.voluntarios WHERE id = voluntario_id AND user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.acoes a JOIN public.ongs o ON a.ong_id = o.id WHERE a.id = acao_id AND o.user_id = auth.uid())
);
CREATE POLICY "Voluntario can insert inscricao" ON public.inscricoes FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.voluntarios WHERE id = voluntario_id AND user_id = auth.uid())
);
CREATE POLICY "Voluntario can delete own inscricao" ON public.inscricoes FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.voluntarios WHERE id = voluntario_id AND user_id = auth.uid())
);
CREATE POLICY "ONG can update inscricao status" ON public.inscricoes FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.acoes a JOIN public.ongs o ON a.ong_id = o.id WHERE a.id = acao_id AND o.user_id = auth.uid())
);
