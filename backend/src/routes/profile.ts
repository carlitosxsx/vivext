import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";

const router = Router();

const updateProfileSchema = z.object({
  nome: z.string().min(2).optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  telefone: z.string().optional(),
});

// ─── GET /profile/me ─────────────────────────────────────────────────────────
// Retorna o perfil do usuário logado + role + dados específicos (ONG ou Voluntário)

router.get(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !profile) {
        res.status(404).json({ error: "Perfil não encontrado." });
        return;
      }

      // Carrega dados específicos conforme o role
      let extra: Record<string, unknown> = {};
      if (req.userRole === "ong") {
        const { data: ong } = await supabaseAdmin
          .from("ongs")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (ong) extra = { ong };
      } else if (req.userRole === "voluntario") {
        const { data: voluntario } = await supabaseAdmin
          .from("voluntarios")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();
        if (voluntario) extra = { voluntario };
      }

      res.json({ ...profile, role: req.userRole, ...extra });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /profile/me ────────────────────────────────────────────────────────
// Atualiza campos básicos do perfil

router.patch(
  "/me",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const body = updateProfileSchema.parse(req.body);

      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
