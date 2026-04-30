import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { authenticate, requireOng, requireVoluntario } from "../middleware/auth";
import { supabaseAdmin } from "../supabaseClient";

const router = Router();

const createInscricaoSchema = z.object({
  acao_id: z.string().uuid("acao_id deve ser um UUID válido."),
});

const updateStatusSchema = z.object({
  status: z.enum(["aprovado", "recusado"]),
});

// ─── GET /inscricoes/minhas ───────────────────────────────────────────────────
// Voluntário visualiza seu histórico de inscrições

router.get(
  "/minhas",
  authenticate,
  requireVoluntario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;

      // Busca o registro de voluntário
      const { data: voluntario, error: volError } = await supabaseAdmin
        .from("voluntarios")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (volError || !voluntario) {
        res.status(404).json({ error: "Voluntário não encontrado." });
        return;
      }

      const { data, error } = await supabaseAdmin
        .from("inscricoes")
        .select(
          `id, status, created_at, updated_at, acao_id,
           acoes(id, titulo, descricao, data, local, categoria, vagas_total, status, imagem_url,
             ongs(id, nome)
           )`
        )
        .eq("voluntario_id", voluntario.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      res.json(data ?? []);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /inscricoes/acao/:acao_id ────────────────────────────────────────────
// ONG visualiza todos os voluntários inscritos em uma ação

router.get(
  "/acao/:acao_id",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { acao_id } = req.params;

      // Confirma que a ação pertence à ONG do usuário
      const { data: ong } = await supabaseAdmin
        .from("ongs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!ong) {
        res.status(403).json({ error: "ONG não encontrada." });
        return;
      }

      const { data: acao } = await supabaseAdmin
        .from("acoes")
        .select("id, titulo")
        .eq("id", acao_id)
        .eq("ong_id", ong.id)
        .maybeSingle();

      if (!acao) {
        res.status(403).json({ error: "Ação não pertence à sua ONG." });
        return;
      }

      // Busca inscrições com dados do voluntário
      const { data: inscricoes, error } = await supabaseAdmin
        .from("inscricoes")
        .select(
          "id, status, created_at, updated_at, voluntario_id, voluntarios(id, user_id, habilidades)"
        )
        .eq("acao_id", acao_id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Enriquece com perfis dos voluntários
      const userIds = [
        ...new Set(
          (inscricoes ?? [])
            .map((i: any) => i.voluntarios?.user_id)
            .filter(Boolean) as string[]
        ),
      ];

      let profileMap: Record<string, unknown> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await supabaseAdmin
          .from("profiles")
          .select("id, nome, email, cidade, estado, telefone")
          .in("id", userIds);

        profileMap = Object.fromEntries(
          (profiles ?? []).map((p) => [p.id, p])
        );
      }

      const result = (inscricoes ?? []).map((i: any) => ({
        ...i,
        voluntario_profile: i.voluntarios?.user_id
          ? profileMap[i.voluntarios.user_id] ?? null
          : null,
      }));

      res.json({ acao, inscricoes: result });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /inscricoes ─────────────────────────────────────────────────────────
// Voluntário se inscreve em uma ação

router.post(
  "/",
  authenticate,
  requireVoluntario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { acao_id } = createInscricaoSchema.parse(req.body);

      // Verifica se a ação existe e está ativa
      const { data: acao, error: acaoError } = await supabaseAdmin
        .from("acoes")
        .select("id, titulo, vagas_total, status")
        .eq("id", acao_id)
        .maybeSingle();

      if (acaoError || !acao) {
        res.status(404).json({ error: "Ação não encontrada." });
        return;
      }

      if (acao.status !== "ativa") {
        res.status(400).json({ error: "Esta ação não está mais disponível para inscrições." });
        return;
      }

      // Verifica vagas disponíveis
      const { count: inscritosAprovados } = await supabaseAdmin
        .from("inscricoes")
        .select("id", { count: "exact", head: true })
        .eq("acao_id", acao_id)
        .eq("status", "aprovado");

      if (
        acao.vagas_total > 0 &&
        (inscritosAprovados ?? 0) >= acao.vagas_total
      ) {
        res.status(400).json({ error: "Não há vagas disponíveis nesta ação." });
        return;
      }

      // Busca o voluntário
      const { data: voluntario } = await supabaseAdmin
        .from("voluntarios")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!voluntario) {
        res.status(404).json({ error: "Registro de voluntário não encontrado." });
        return;
      }

      // Verifica se já está inscrito
      const { data: existente } = await supabaseAdmin
        .from("inscricoes")
        .select("id, status")
        .eq("acao_id", acao_id)
        .eq("voluntario_id", voluntario.id)
        .maybeSingle();

      if (existente) {
        res.status(409).json({
          error: "Você já está inscrito nesta ação.",
          status: existente.status,
        });
        return;
      }

      // Cria inscrição
      const { data, error } = await supabaseAdmin
        .from("inscricoes")
        .insert({
          acao_id,
          voluntario_id: voluntario.id,
          status: "pendente",
        })
        .select()
        .single();

      if (error) throw error;
      res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }
);

// ─── DELETE /inscricoes/:id ───────────────────────────────────────────────────
// Voluntário remove a própria inscrição

router.delete(
  "/:id",
  authenticate,
  requireVoluntario,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;

      const { data: voluntario } = await supabaseAdmin
        .from("voluntarios")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!voluntario) {
        res.status(404).json({ error: "Voluntário não encontrado." });
        return;
      }

      // Confirma que a inscrição pertence ao voluntário
      const { data: inscricao } = await supabaseAdmin
        .from("inscricoes")
        .select("id, status")
        .eq("id", id)
        .eq("voluntario_id", voluntario.id)
        .maybeSingle();

      if (!inscricao) {
        res.status(404).json({ error: "Inscrição não encontrada." });
        return;
      }

      if (inscricao.status === "aprovado") {
        res
          .status(400)
          .json({ error: "Não é possível cancelar uma inscrição já aprovada." });
        return;
      }

      const { error } = await supabaseAdmin
        .from("inscricoes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }
);

// ─── PATCH /inscricoes/:id/status ─────────────────────────────────────────────
// ONG aprova ou recusa um voluntário inscrito

router.patch(
  "/:id/status",
  authenticate,
  requireOng,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
      const { id } = req.params;
      const { status } = updateStatusSchema.parse(req.body);

      // Busca a inscrição com a ação associada
      const { data: inscricao, error: inscError } = await supabaseAdmin
        .from("inscricoes")
        .select("id, status, acao_id, acoes(ong_id)")
        .eq("id", id)
        .maybeSingle();

      if (inscError || !inscricao) {
        res.status(404).json({ error: "Inscrição não encontrada." });
        return;
      }

      // Confirma que a ação pertence à ONG do usuário
      const { data: ong } = await supabaseAdmin
        .from("ongs")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!ong || (inscricao.acoes as any)?.ong_id !== ong.id) {
        res.status(403).json({ error: "Você não tem permissão para gerenciar esta inscrição." });
        return;
      }

      if (inscricao.status !== "pendente") {
        res.status(400).json({
          error: `Esta inscrição já foi ${inscricao.status}. Não é possível alterá-la novamente.`,
        });
        return;
      }

      // Se for aprovar, verifica se ainda há vagas
      if (status === "aprovado") {
        const { data: acao } = await supabaseAdmin
          .from("acoes")
          .select("vagas_total")
          .eq("id", inscricao.acao_id)
          .single();

        if (acao && acao.vagas_total > 0) {
          const { count } = await supabaseAdmin
            .from("inscricoes")
            .select("id", { count: "exact", head: true })
            .eq("acao_id", inscricao.acao_id)
            .eq("status", "aprovado");

          if ((count ?? 0) >= acao.vagas_total) {
            res.status(400).json({ error: "Limite de vagas atingido para esta ação." });
            return;
          }
        }
      }

      const { data, error } = await supabaseAdmin
        .from("inscricoes")
        .update({ status, updated_at: new Date().toISOString() })
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

export default router;
