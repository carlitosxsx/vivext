# connect-contribute-api

Backend REST API para a plataforma **Connect & Contribute** — conecta ONGs e voluntários.

Construído com **Node.js + Express + TypeScript**, conectado ao mesmo banco Supabase do front-end.

---

## 📁 Estrutura

```
src/
├── index.ts                  → Entry point (servidor Express)
├── supabaseClient.ts         → Cliente admin (service_role) + helper por usuário
├── types/
│   └── database.ts           → Tipos TypeScript espelhando o schema do Supabase
├── middleware/
│   ├── auth.ts               → Valida JWT do Supabase, injeta userId/role no request
│   └── errorHandler.ts       → Tratamento centralizado de erros (Zod + genérico)
└── routes/
    ├── auth.ts               → Cadastro de voluntário/ONG e login
    ├── profile.ts            → Perfil do usuário logado
    ├── ongs.ts               → CRUD de ONGs + dashboard
    ├── acoes.ts              → CRUD de ações voluntárias
    ├── inscricoes.ts         → Inscrição, remoção e aprovação de voluntários
    └── voluntarios.ts        → Dados e histórico do voluntário
```

---

## ⚙️ Configuração

### 1. Instale as dependências

```bash
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha:

```bash
cp .env.example .env
```

Edite o `.env`:

```env
# URL do seu projeto Supabase
SUPABASE_URL=https://hwuvproazzcccjhumxkg.supabase.co

# ⚠️ NUNCA exponha essa chave no front-end!
# Encontre em: Supabase Dashboard → Project Settings → API → service_role key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Chave pública (anon), usada para criar clientes autenticados por usuário
SUPABASE_ANON_KEY=eyJhbGci...

# Porta do servidor (padrão: 3000)
PORT=3000

NODE_ENV=development

# URL do front-end para o CORS
# Em produção, coloque a URL real do Lovable/Vercel/etc.
FRONTEND_URL=http://localhost:5173
```

> **Como obter a `service_role_key`:**
> Supabase Dashboard → seu projeto → Project Settings → API → **service_role** (secret)

### 3. Rode em desenvolvimento

```bash
npm run dev
```

### 4. Build para produção

```bash
npm run build
npm start
```

---

## 🛣️ Mapa de Rotas

### Autenticação (público)

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | `/auth/cadastro/voluntario` | Cadastra novo voluntário |
| POST | `/auth/cadastro/ong` | Cadastra nova ONG |
| POST | `/auth/login` | Login (retorna access_token) |

**Exemplo — Cadastro de voluntário:**
```json
POST /auth/cadastro/voluntario
{
  "nome": "João Silva",
  "email": "joao@email.com",
  "senha": "minhasenha123",
  "cidade": "Joinville",
  "estado": "SC"
}
```

---

### Perfil (autenticado)

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/profile/me` | Retorna perfil + role + dados específicos |
| PATCH | `/profile/me` | Atualiza nome, cidade, estado, telefone |

---

### ONGs (leitura pública, escrita restrita)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/ongs` | Público | Lista ONGs (query: `busca`, `categoria`, `estado`) |
| GET | `/ongs/:id` | Público | Detalhe da ONG + ações ativas |
| PATCH | `/ongs/me` | ONG | Edita dados da própria ONG |
| GET | `/ongs/me/dashboard` | ONG | Dashboard completo (ações + inscrições + stats) |

---

### Ações Voluntárias (leitura pública, escrita restrita)

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/acoes` | Público | Lista ações (query: `busca`, `categoria`, `ong_id`, `status`) |
| GET | `/acoes/:id` | Público | Detalhe da ação + stats de inscrições |
| POST | `/acoes` | ONG | Cria nova ação |
| PATCH | `/acoes/:id` | ONG | Edita ação própria |
| DELETE | `/acoes/:id` | ONG | Exclui ação própria |

**Exemplo — Criar ação:**
```json
POST /acoes
Authorization: Bearer <token>
{
  "titulo": "Aula de Reforço",
  "descricao": "Aulas de matemática para alunos do ensino médio.",
  "data": "2026-05-10",
  "local": "Joinville, SC",
  "categoria": "Educação",
  "vagas_total": 15,
  "status": "ativa"
}
```

---

### Inscrições

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/inscricoes/minhas` | Voluntário | Histórico de inscrições do voluntário |
| GET | `/inscricoes/acao/:acao_id` | ONG | Lista voluntários inscritos em uma ação |
| POST | `/inscricoes` | Voluntário | Inscrever-se em uma ação |
| DELETE | `/inscricoes/:id` | Voluntário | Remover inscrição (só pendentes) |
| PATCH | `/inscricoes/:id/status` | ONG | Aprovar ou recusar voluntário |

**Exemplo — Inscrever-se:**
```json
POST /inscricoes
Authorization: Bearer <token>
{
  "acao_id": "uuid-da-acao"
}
```

**Exemplo — Aprovar voluntário:**
```json
PATCH /inscricoes/uuid-da-inscricao/status
Authorization: Bearer <token>
{
  "status": "aprovado"
}
```

---

### Voluntários

| Método | Rota | Acesso | Descrição |
|--------|------|--------|-----------|
| GET | `/voluntarios/me` | Voluntário | Dados do voluntário logado |
| PATCH | `/voluntarios/me` | Voluntário | Atualiza habilidades |
| GET | `/voluntarios/me/historico` | Voluntário | Histórico + cronograma de ações |
| GET | `/voluntarios/:id` | Autenticado | Detalhe de um voluntário (para ONGs) |

---

## 🔐 Autenticação

Todas as rotas protegidas exigem o header:

```
Authorization: Bearer <supabase_access_token>
```

O token é o mesmo JWT retornado pelo Supabase Auth (ou pelo endpoint `/auth/login`).

**No front-end, para fazer chamadas ao backend:**

```typescript
import { supabase } from "@/integrations/supabase/client";

const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;

const response = await fetch("http://localhost:3000/acoes", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`,
  },
  body: JSON.stringify({ titulo: "...", ... }),
});
```

---

## 🔗 Integração com o Front-end

O front-end atual faz chamadas **diretamente ao Supabase** pelo SDK. Para migrar gradualmente para o backend:

1. Adicione a URL do backend ao `.env` do front-end:
   ```env
   VITE_API_URL=http://localhost:3000
   ```

2. Crie um helper de fetch autenticado em `src/lib/api.ts`:
   ```typescript
   import { supabase } from "@/integrations/supabase/client";

   export async function apiFetch(path: string, options: RequestInit = {}) {
     const { data: { session } } = await supabase.auth.getSession();
     const token = session?.access_token;

     return fetch(`${import.meta.env.VITE_API_URL}${path}`, {
       ...options,
       headers: {
         "Content-Type": "application/json",
         ...(token ? { Authorization: `Bearer ${token}` } : {}),
         ...options.headers,
       },
     });
   }
   ```

3. Substitua as chamadas `supabase.from(...)` nas páginas pelo `apiFetch`.

---

## 🚀 Deploy

### Railway / Render / Fly.io

1. Faça push do projeto para um repositório Git
2. Configure as variáveis de ambiente no painel da plataforma
3. Comando de build: `npm run build`
4. Comando de start: `npm start`

### Variáveis de ambiente necessárias em produção

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_ANON_KEY
PORT
NODE_ENV=production
FRONTEND_URL=https://seu-frontend.lovableproject.com
```

---

## 🛡️ Segurança implementada

- **Helmet** — headers HTTP seguros
- **CORS** — restrito ao domínio do front-end
- **Rate limiting** — 100 req/min geral, 20 req/min nas rotas de auth
- **Validação com Zod** — todos os inputs são validados antes de chegar ao banco
- **JWT verificado pelo Supabase** — nenhuma operação privilegiada sem autenticação válida
- **Verificação de posse** — ONG só edita/exclui suas próprias ações; voluntário só remove suas próprias inscrições
- **Verificação de vagas** — impede inscrições além do limite configurado

---

## 📦 Dependências principais

| Pacote | Uso |
|--------|-----|
| `express` | Servidor HTTP |
| `@supabase/supabase-js` | Cliente do banco de dados |
| `zod` | Validação de entrada |
| `helmet` | Headers de segurança |
| `cors` | Controle de origem |
| `express-rate-limit` | Rate limiting |
| `dotenv` | Variáveis de ambiente |
| `tsx` | Execução TypeScript em dev |
