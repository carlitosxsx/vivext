// Types kept for component compatibility - no mock data
export interface Acao {
  id: string;
  titulo: string;
  descricao: string;
  ongNome: string;
  ongId: string;
  data: string;
  local: string;
  categoria: string;
  vagasTotal: number;
  vagasPreenchidas: number;
  status: "ativa" | "concluida" | "rascunho";
  imagemUrl?: string;
}

export interface ONG {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  cidade: string;
  estado: string;
  email: string;
  telefone: string;
  site?: string;
}

export interface Voluntario {
  id: string;
  nome: string;
  email: string;
  cidade: string;
  estado: string;
  habilidades: string[];
  statusInscricao?: "pendente" | "aprovado" | "recusado";
}

export const CATEGORIAS = [
  "Educação",
  "Saúde",
  "Meio Ambiente",
  "Assistência Social",
  "Cultura",
  "Animais",
  "Esporte",
  "Tecnologia",
] as const;
