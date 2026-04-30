/**
 * src/lib/api.ts
 *
 * Helper centralizado para todas as chamadas ao backend.
 * O token JWT é obtido automaticamente do Supabase Auth a cada chamada,
 * garantindo que nunca seja enviado um token expirado.
 *
 * Uso:
 *   import { api } from "@/lib/api";
 *   const acoes = await api.get("/acoes");
 *   const nova  = await api.post("/acoes", { titulo: "...", ... });
 */

import { supabase } from "@/integrations/supabase/client";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

// ─── Tipos de resposta de erro ────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Helper interno ───────────────────────────────────────────────────────────

async function request<T = unknown>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  // Pega o token JWT atual do Supabase (pode ser null se não logado)
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // Respostas sem corpo (204 No Content)
  if (res.status === 204) return undefined as T;

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(res.status, data?.error ?? "Erro desconhecido.", data?.details);
  }

  return data as T;
}

// ─── API pública ──────────────────────────────────────────────────────────────

export const api = {
  get: <T = unknown>(path: string) => request<T>("GET", path),
  post: <T = unknown>(path: string, body: unknown) => request<T>("POST", path, body),
  patch: <T = unknown>(path: string, body: unknown) => request<T>("PATCH", path, body),
  delete: <T = unknown>(path: string) => request<T>("DELETE", path),
};

// ─── Endpoints tipados ────────────────────────────────────────────────────────
// Conveniências para não repetir strings de rota nas páginas

export const acaoApi = {
  listar: (params?: { busca?: string; categoria?: string; status?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "")
      )
    ).toString();
    return api.get<AcaoComOng[]>(`/acoes${qs ? `?${qs}` : ""}`);
  },
  buscar: (id: string) => api.get<AcaoDetalhe>(`/acoes/${id}`),
  criar: (body: CriarAcaoBody) => api.post<Acao>("/acoes", body),
  atualizar: (id: string, body: Partial<CriarAcaoBody>) => api.patch<Acao>(`/acoes/${id}`, body),
  excluir: (id: string) => api.delete(`/acoes/${id}`),
};

export const ongApi = {
  listar: (params?: { busca?: string; categoria?: string; estado?: string }) => {
    const qs = new URLSearchParams(
      Object.fromEntries(
        Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== "")
      )
    ).toString();
    return api.get<Ong[]>(`/ongs${qs ? `?${qs}` : ""}`);
  },
  buscar: (id: string) => api.get<OngComAcoes>(`/ongs/${id}`),
  dashboard: () => api.get<OngDashboard>("/ongs/me/dashboard"),
  atualizar: (body: Partial<Ong>) => api.patch<Ong>("/ongs/me", body),
};

export const inscricaoApi = {
  minhas: () => api.get<InscricaoComAcao[]>("/inscricoes/minhas"),
  porAcao: (acaoId: string) => api.get<{ acao: Acao; inscricoes: InscricaoComVoluntario[] }>(`/inscricoes/acao/${acaoId}`),
  inscrever: (acaoId: string) => api.post<Inscricao>("/inscricoes", { acao_id: acaoId }),
  remover: (id: string) => api.delete(`/inscricoes/${id}`),
  atualizarStatus: (id: string, status: "aprovado" | "recusado") =>
    api.patch<Inscricao>(`/inscricoes/${id}/status`, { status }),
};

export const voluntarioApi = {
  me: () => api.get<VoluntarioMe>("/voluntarios/me"),
  historico: () => api.get<{ historico: InscricaoComAcao[]; cronograma: InscricaoComAcao[] }>("/voluntarios/me/historico"),
  atualizar: (habilidades: string[]) => api.patch<Voluntario>("/voluntarios/me", { habilidades }),
};

export const profileApi = {
  me: () => api.get<Profile>("/profile/me"),
  atualizar: (body: { nome?: string; cidade?: string; estado?: string; telefone?: string }) =>
    api.patch<Profile>("/profile/me", body),
};

export const authApi = {
  cadastroVoluntario: (body: CadastroVoluntarioBody) =>
    api.post("/auth/cadastro/voluntario", body),
  cadastroOng: (body: CadastroOngBody) =>
    api.post("/auth/cadastro/ong", body),
};

// ─── Tipos locais (espelham o backend) ───────────────────────────────────────

export interface Acao {
  id: string;
  ong_id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  categoria: string;
  vagas_total: number;
  status: "ativa" | "concluida" | "rascunho";
  imagem_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AcaoComOng extends Acao {
  ongs: { nome: string } | null;
  vagas_preenchidas: number;
}

export interface AcaoDetalhe extends Acao {
  ongs: { id: string; nome: string; email: string; telefone: string; site: string | null; cidade: string; estado: string } | null;
  inscricoes_stats: { total: number; aprovados: number; pendentes: number };
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

export interface OngComAcoes extends Ong {
  acoes: Acao[];
}

export interface OngDashboard {
  ong: { id: string; nome: string };
  acoes: Acao[];
  inscricoes: InscricaoComVoluntario[];
  stats: {
    total_acoes: number;
    acoes_ativas: number;
    total_inscricoes: number;
    inscricoes_pendentes: number;
    inscricoes_aprovadas: number;
  };
}

export interface Inscricao {
  id: string;
  acao_id: string;
  voluntario_id: string;
  status: "pendente" | "aprovado" | "recusado";
  created_at: string;
  updated_at: string;
}

export interface InscricaoComAcao extends Inscricao {
  acoes: (Acao & { ongs: { id: string; nome: string } | null }) | null;
}

export interface InscricaoComVoluntario extends Inscricao {
  voluntarios: { id: string; user_id: string; habilidades: string[] } | null;
  voluntario_profile: { id: string; nome: string; email: string; cidade: string | null; estado: string | null; telefone: string | null } | null;
  acoes: { titulo: string } | null;
}

export interface Voluntario {
  id: string;
  user_id: string;
  habilidades: string[];
}

export interface VoluntarioMe extends Voluntario {
  nome: string;
  email: string;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
}

export interface Profile {
  id: string;
  nome: string;
  email: string;
  cidade: string | null;
  estado: string | null;
  telefone: string | null;
  role: "ong" | "voluntario" | null;
  ong?: Ong;
  voluntario?: Voluntario;
}

export interface CriarAcaoBody {
  titulo: string;
  descricao?: string;
  data: string;
  local: string;
  categoria: string;
  vagas_total?: number;
  status?: "ativa" | "rascunho";
  imagem_url?: string;
}

export interface CadastroVoluntarioBody {
  nome: string;
  email: string;
  senha: string;
  cidade?: string;
  estado?: string;
}

export interface CadastroOngBody {
  nome: string;
  email: string;
  senha: string;
  telefone?: string;
  cidade?: string;
  estado?: string;
  descricao?: string;
  categoria?: string;
  site?: string;
}
