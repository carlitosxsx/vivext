import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireVoluntario } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";

const router = Router();

const updateVoluntarioSchema = z.object({
  habilidades: z
    .array(z.string().min(1))
    .max(20, "Máximo de 20 habilidades.")
    .optional(),
});

// ─── GET /voluntarios/me ─────────────────────────────────────────────────────
// Voluntário visualiza seus próprios dados + histórico de ações

router.get(
  "/me",
  authenticate,
  requireVoluntario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id, nome, email, cidade, estado, telefone")
        .eq("id", userId)
        .maybeSingle();

      const { data: voluntario, error } = await supabaseAdmin
        .from("voluntarios")
        .select("id, habilidades, created_at, updated_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (error || !voluntario) {
        res.status(404).json({ error: "Voluntário não encontrado." });
        return;
      }

      res.json({ ...profile, ...voluntario, user_id: userId });
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /voluntarios/me ───────────────────────────────────────────────────
// Voluntário atualiza suas habilidades

router.patch(
  "/me",
  authenticate,
  requireVoluntario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const body = updateVoluntarioSchema.parse(req.body);

      const { data, error } = await supabaseAdmin
        .from("voluntarios")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /voluntarios/me/historico ───────────────────────────────────────────
// Voluntário visualiza histórico de ações nas quais participou (aprovadas)

router.get(
  "/me/historico",
  authenticate,
  requireVoluntario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const { data: voluntario } = await supabaseAdmin
        .from("voluntarios")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!voluntario) {
        res.status(404).json({ error: "Voluntário não encontrado." });
        return;
      }

      // Inscrições aprovadas em ações concluídas = histórico real
      // Inscrições aprovadas em ações ativas = cronograma
      const { data, error } = await supabaseAdmin
        .from("inscricoes")
        .select(
          `id, status, created_at, updated_at,
           acoes(
             id, titulo, descricao, data, local, categoria,
             status, imagem_url,
             ongs(id, nome)
           )`
        )
        .eq("voluntario_id", voluntario.id)
        .eq("status", "aprovado")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const historico = (data ?? []).filter(
        (i: any) => i.acoes?.status === "concluida"
      );
      const cronograma = (data ?? []).filter(
        (i: any) => i.acoes?.status === "ativa"
      );

      res.json({ historico, cronograma });
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /voluntarios/:id ────────────────────────────────────────────────────
// ONG visualiza detalhes de um voluntário específico (dados básicos + habilidades)

router.get(
  "/:id",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params; // id do registro voluntarios

      const { data: voluntario, error } = await supabaseAdmin
        .from("voluntarios")
        .select("id, user_id, habilidades, created_at")
        .eq("id", id)
        .maybeSingle();

      if (error || !voluntario) {
        res.status(404).json({ error: "Voluntário não encontrado." });
        return;
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("nome, email, cidade, estado")
        .eq("id", voluntario.user_id)
        .maybeSingle();

      res.json({ ...voluntario, profile: profile ?? null });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
