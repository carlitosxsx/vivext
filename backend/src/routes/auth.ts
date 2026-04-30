import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseClient";

const router = Router();

// ─── Schemas de validação ────────────────────────────────────────────────────

const cadastroVoluntarioSchema = z.object({
  nome: z.string().min(2, "Nome deve ter ao menos 2 caracteres."),
  email: z.string().email("Email inválido."),
  senha: z.string().min(6, "Senha deve ter ao menos 6 caracteres."),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
});

const cadastroOngSchema = z.object({
  nome: z.string().min(2),
  email: z.string().email(),
  senha: z.string().min(6),
  telefone: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().max(2).optional(),
  descricao: z.string().optional(),
  categoria: z.string().optional(),
  site: z.string().url().optional().or(z.literal("")),
});

// ─── POST /auth/cadastro/voluntario ─────────────────────────────────────────

router.post(
  "/cadastro/voluntario",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = cadastroVoluntarioSchema.parse(req.body);

      // 1. Cria usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.senha,
        email_confirm: false, // Supabase enviará email de confirmação
        user_metadata: { nome: body.nome },
      });

      if (authError) throw authError;
      const userId = authData.user.id;

      // 2. O trigger handle_new_user já cria o profile automaticamente.
      //    Aqui apenas atualizamos cidade/estado se informados.
      if (body.cidade || body.estado) {
        await supabaseAdmin
          .from("profiles")
          .update({ cidade: body.cidade ?? null, estado: body.estado ?? null })
          .eq("id", userId);
      }

      // 3. Atribui role de voluntário
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "voluntario" });

      // 4. Cria registro de voluntário
      await supabaseAdmin
        .from("voluntarios")
        .insert({ user_id: userId, habilidades: [] });

      res.status(201).json({
        message:
          "Voluntário cadastrado com sucesso! Verifique seu email para confirmar a conta.",
        userId,
      });
    } catch (err) {
      next(err);
    }
  }
);

// ─── POST /auth/cadastro/ong ─────────────────────────────────────────────────

router.post(
  "/cadastro/ong",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = cadastroOngSchema.parse(req.body);

      // 1. Cria usuário no Supabase Auth
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.email,
        password: body.senha,
        email_confirm: false,
        user_metadata: { nome: body.nome },
      });

      if (authError) throw authError;
      const userId = authData.user.id;

      // 2. Atualiza profile com telefone/cidade/estado
      await supabaseAdmin
        .from("profiles")
        .update({
          cidade: body.cidade ?? null,
          estado: body.estado ?? null,
          telefone: body.telefone ?? null,
        })
        .eq("id", userId);

      // 3. Atribui role de ONG
      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: userId, role: "ong" });

      // 4. Cria registro de ONG
      await supabaseAdmin.from("ongs").insert({
        user_id: userId,
        nome: body.nome,
        email: body.email,
        telefone: body.telefone ?? "",
        cidade: body.cidade ?? "",
        estado: body.estado ?? "",
        descricao: body.descricao ?? "",
        categoria: body.categoria ?? "",
        site: body.site || null,
      });

      res.status(201).json({
        message:
          "ONG cadastrada com sucesso! Verifique seu email para confirmar a conta.",
        userId,
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * Login: o frontend usa o SDK do Supabase diretamente.
 * Esta rota existe para integrações server-to-server ou testes.
 * POST /auth/login → { email, senha } → retorna access_token
 */
router.post(
  "/login",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, senha } = z
        .object({ email: z.string().email(), senha: z.string().min(6) })
        .parse(req.body);

      const { data, error } = await supabaseAdmin.auth.signInWithPassword({
        email,
        password: senha,
      });

      if (error) {
        res.status(401).json({ error: "Credenciais inválidas." });
        return;
      }

      res.json({
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
