import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireOng } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";

const router = Router();

const acaoSchema = z.object({
  titulo: z.string().min(3, "Título deve ter ao menos 3 caracteres."),
  descricao: z.string().optional().default(""),
  data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD."),
  local: z.string().min(2, "Local obrigatório."),
  categoria: z.string().min(1, "Categoria obrigatória."),
  vagas_total: z.number().int().nonnegative().optional().default(0),
  status: z.enum(["ativa", "rascunho", "concluida"]).optional().default("ativa"),
  imagem_url: z.string().url().optional().nullable(),
});

const updateAcaoSchema = acaoSchema.partial();

// ─── GET /acoes ───────────────────────────────────────────────────────────────
// Listagem pública de ações (filtros opcionais)

router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { busca, categoria, status, ong_id } = req.query as Record<string, string>;

    let query = supabaseAdmin
      .from("acoes")
      .select(
        "id, titulo, descricao, data, local, categoria, vagas_total, status, imagem_url, ong_id, created_at, ongs(nome)"
      );

    // Por padrão exibe apenas ativas para visitantes / voluntários
    query = query.eq("status", status ?? "ativa");

    if (busca) {
      query = query.or(
        `titulo.ilike.%${busca}%,descricao.ilike.%${busca}%,local.ilike.%${busca}%`
      );
    }
    if (categoria) query = query.eq("categoria", categoria);
    if (ong_id) query = query.eq("ong_id", ong_id);

    query = query.order("data", { ascending: true });

    const { data, error } = await query;
    if (error) throw error;

    // Adiciona contagem de inscrições aprovadas por ação
    const ids = (data ?? []).map((a) => a.id);
    let inscCounts: Record<string, number> = {};
    if (ids.length > 0) {
      const { data: inscData } = await supabaseAdmin
        .from("inscricoes")
        .select("acao_id")
        .in("acao_id", ids)
        .eq("status", "aprovado");
      (inscData ?? []).forEach((i) => {
        inscCounts[i.acao_id] = (inscCounts[i.acao_id] ?? 0) + 1;
      });
    }

    const result = (data ?? []).map((a) => ({
      ...a,
      vagas_preenchidas: inscCounts[a.id] ?? 0,
    }));

    res.json(result);
  } catch (err) {
    next(err);
  }
});

// ─── GET /acoes/:id ───────────────────────────────────────────────────────────
// Detalhe de uma ação com ONG e contagem de inscrições

router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const { data: acao, error } = await supabaseAdmin
      .from("acoes")
      .select("*, ongs(id, nome, email, telefone, site, cidade, estado)")
      .eq("id", id)
      .maybeSingle();

    if (error || !acao) {
      res.status(404).json({ error: "Ação não encontrada." });
      return;
    }

    // Conta inscrições por status
    const { data: inscStats } = await supabaseAdmin
      .from("inscricoes")
      .select("status")
      .eq("acao_id", id);

    const stats = {
      total: inscStats?.length ?? 0,
      aprovados: inscStats?.filter((i) => i.status === "aprovado").length ?? 0,
      pendentes: inscStats?.filter((i) => i.status === "pendente").length ?? 0,
    };

    res.json({ ...acao, inscricoes_stats: stats });
  } catch (err) {
    next(err);
  }
});

// ─── POST /acoes ──────────────────────────────────────────────────────────────
// ONG cria uma nova ação

router.post(
  "/",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const body = acaoSchema.parse(req.body);

      // Verifica se a ONG pertence ao usuário
      const { data: ong, error: ongError } = await supabaseAdmin
        .from("ongs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (ongError || !ong) {
        res.status(404).json({ error: "ONG não encontrada para este usuário." });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("acoes")
        .insert({ ...body, ong_id: ong.id })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /acoes/:id ─────────────────────────────────────────────────────────
// ONG edita uma ação própria

router.patch(
  "/:id",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const body = updateAcaoSchema.parse(req.body);

      // Confirma posse: ação pertence à ONG do usuário
      const { data: ong } = await supabaseAdmin
        .from("ongs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!ong) {
        res.status(403).json({ error: "ONG não encontrada." });
        return;
      }

      const { data: existing } = await supabaseAdmin
        .from("acoes")
        .select("id")
        .eq("id", id)
        .eq("ong_id", ong.id)
        .maybeSingle();

      if (!existing) {
        res.status(403).json({ error: "Ação não pertence à sua ONG." });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("acoes")
        .update({ ...body, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      res.json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /acoes/:id ────────────────────────────────────────────────────────
// ONG exclui uma ação própria

router.delete(
  "/:id",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const { data: ong } = await supabaseAdmin
        .from("ongs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!ong) {
        res.status(403).json({ error: "ONG não encontrada." });
        return;
      }

      const { error } = await supabaseAdmin
        .from("acoes")
        .delete()
        .eq("id", id)
        .eq("ong_id", ong.id);

      if (error) throw error;
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

export default router;
