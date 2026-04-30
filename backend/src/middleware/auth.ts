import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabaseClient";
import type { AppRole } from "../types/database";

// Extende o tipo Request para incluir dados do usuário autenticado
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: AppRole | null;
      accessToken?: string;
    }
  }
}

/**
 * Middleware que valida o Bearer token JWT do Supabase.
 * Injeta userId, userRole e accessToken no request.
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token de autenticação ausente." });
    return;
  }

  const token = authHeader.split(" ")[1];

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Token inválido ou expirado." });
    return;
  }

  // Busca o role do usuário
  const { data: roleData } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", data.user.id)
    .maybeSingle();

  req.userId = data.user.id;
  req.userRole = (roleData?.role as AppRole) ?? null;
  req.accessToken = token;

  next();
}

/**
 * Middleware que garante que apenas ONGs acessem a rota.
 */
export function requireOng(req: Request, res: Response, next: NextFunction): void {
  if (req.userRole !== "ong") {
    res.status(403).json({ error: "Acesso restrito a ONGs." });
    return;
  }
  next();
}

/**
 * Middleware que garante que apenas Voluntários acessem a rota.
 */
export function requireVoluntario(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (req.userRole !== "voluntario") {
    res.status(403).json({ error: "Acesso restrito a voluntários." });
    return;
  }
  next();
}
