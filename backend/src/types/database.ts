// Tipos espelhando o schema do Supabase (src/types/database.ts)

export type AcaoStatus = "ativa" | "concluida" | "rascunho";
export type AppRole = "ong" | "voluntario";
export type InscricaoStatus = "pendente" | "aprovado" | "recusado";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: AppRole;
}

export interface Ong {
  id: string;
  user_id: string;
  nome: string;
  descricao: string;
  categoria: string;
  cidade: string;
  estado: string;
  email: string;
  telefone: string;
  site: string | null;
  created_at: string;
  updated_at: string;
}

export interface Voluntario {
  id: string;
  user_id: string;
  habilidades: string[];
  created_at: string;
  updated_at: string;
}

export interface Acao {
  id: string;
  ong_id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  categoria: string;
  vagas_total: number;
  status: AcaoStatus;
  imagem_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Inscricao {
  id: string;
  acao_id: string;
  voluntario_id: string;
  status: InscricaoStatus;
  created_at: string;
  updated_at: string;
}

// Payloads de entrada (validados via Zod nas rotas)
export interface CreateAcaoBody {
  titulo: string;
  descricao?: string;
  data: string;
  local: string;
  categoria: string;
  vagas_total?: number;
  status?: AcaoStatus;
  imagem_url?: string;
}

export interface UpdateAcaoBody extends Partial<CreateAcaoBody> {}

export interface CreateInscricaoBody {
  acao_id: string;
}

export interface UpdateInscricaoStatusBody {
  status: "aprovado" | "recusado";
}

export interface UpdateProfileBody {
  nome?: string;
  cidade?: string;
  estado?: string;
  telefone?: string;
}

export interface UpdateOngBody {
  nome?: string;
  descricao?: string;
  categoria?: string;
  cidade?: string;
  estado?: string;
  email?: string;
  telefone?: string;
  site?: string;
}

export interface UpdateVoluntarioBody {
  habilidades?: string[];
}
