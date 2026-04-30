import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireOng } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";

const router = Router();

const updateOngSchema = z.object({
  nome: z.string().min(2).optional(),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  email: z.string().email().optional(),
  telefone: z.string().optional(),
  site: z.string().url().optional().or(z.literal("")).nullable(),
});

// ─── GET /ongs ───────────────────────────────────────────────────────────────
// Listagem pública de ONGs

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busca, categoria, estado } = req.query as Record<string, string>;

    let query = supabaseAdmin
      .from("ongs")
      .select("id, nome, descricao, categoria, cidade, estado, email, telefone, site, created_at");

    if (busca) {
      query = query.or(
        `nome.ilike.%${busca}%,descricao.ilike.%${busca}%,cidade.ilike.%${busca}%`
      );
    }
    if (categoria) query = query.eq("categoria", categoria);
    if (estado) query = query.eq("estado", estado);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.json(data);
  } catch (err) {
    next(err);
  }
});

// ─── GET /ongs/:id ───────────────────────────────────────────────────────────
// Detalhe público de uma ONG + suas ações ativas

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: ong, error } = await supabaseAdmin
      .from("ongs")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !ong) {
      res.status(404).json({ error: "ONG não encontrada." });
      return;
    }

    // Carrega as ações ativas desta ONG
    const { data: acoes } = await supabaseAdmin
      .from("acoes")
      .select("id, titulo, descricao, data, local, categoria, vagas_total, status, imagem_url")
      .eq("ong_id", id)
      .eq("status", "ativa")
      .order("data", { ascending: true });

    res.json({ ...ong, acoes: acoes ?? [] });
  } catch (err) {
    next(err);
  }
});

// ─── PATCH /ongs/me ──────────────────────────────────────────────────────────
// ONG atualiza seus próprios dados

router.patch(
  "/me",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const body = updateOngSchema.parse(req.body);

      const { data, error } = await supabaseAdmin
        .from("ongs")
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

// ─── GET /ongs/me/dashboard ──────────────────────────────────────────────────
// Dados do dashboard da ONG: ações + inscrições + estatísticas

router.get(
  "/me/dashboard",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      const { data: ong, error: ongError } = await supabaseAdmin
        .from("ongs")
        .select("id, nome")
        .eq("user_id", userId)
        .maybeSingle();

      if (ongError || !ong) {
        res.status(404).json({ error: "ONG não encontrada." });
        return;
      }

      // Ações da ONG
      const { data: acoes } = await supabaseAdmin
        .from("acoes")
        .select("id, titulo, data, vagas_total, status, categoria, local")
        .eq("ong_id", ong.id)
        .order("data", { ascending: false });

      const acaoIds = (acoes ?? []).map((a) => a.id);

      // Inscrições com dados do voluntário
      let inscricoes: unknown[] = [];
      if (acaoIds.length > 0) {
        const { data: inscData } = await supabaseAdmin
          .from("inscricoes")
          .select(
            "id, status, acao_id, voluntario_id, created_at, acoes(titulo), voluntarios(id, user_id, habilidades)"
          )
          .in("acao_id", acaoIds);

        if (inscData && inscData.length > 0) {
          // Busca perfis dos voluntários
          const userIds = [
            ...new Set(
              inscData
                .map((i: any) => i.voluntarios?.user_id)
                .filter(Boolean) as string[]
            ),
          ];

          const { data: profiles } = await supabaseAdmin
            .from("profiles")
            .select("id, nome, email, cidade, estado, telefone")
            .in("id", userIds);

          const profileMap = Object.fromEntries(
            (profiles ?? []).map((p) => [p.id, p])
          );

          inscricoes = inscData.map((i: any) => ({
            ...i,
            voluntario_profile: i.voluntarios?.user_id
              ? profileMap[i.voluntarios.user_id] ?? null
              : null,
          }));
        }
      }

      // Estatísticas resumidas
      const stats = {
        total_acoes: (acoes ?? []).length,
        acoes_ativas: (acoes ?? []).filter((a) => a.status === "ativa").length,
        total_inscricoes: (inscricoes as any[]).length,
        inscricoes_pendentes: (inscricoes as any[]).filter(
          (i: any) => i.status === "pendente"
        ).length,
        inscricoes_aprovadas: (inscricoes as any[]).filter(
          (i: any) => i.status === "aprovado"
        ).length,
      };

      res.json({ ong, acoes: acoes ?? [], inscricoes, stats });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
