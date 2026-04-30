import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import authRouter from "./routes/auth";
import profileRouter from "./routes/profile";
import ongsRouter from "./routes/ongs";
import acoesRouter from "./routes/acoes";
import inscricoesRouter from "./routes/inscricoes";
import voluntariosRouter from "./routes/voluntarios";
import { errorHandler } from "./middleware/errorHandler";

dotenv.config();

const app = express();
const PORT = process.env.PORT ?? 3000;
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

// ─── Segurança ───────────────────────────────────────────────────────────────

app.use(helmet());

app.use(
  cors({
    origin: [
      FRONTEND_URL,
      // Suporte a previews do Lovable (*.lovableproject.com)
      /^https:\/\/.*\.lovableproject\.com$/,
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Rate limiting global: 100 req/min por IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Muitas requisições. Tente novamente em instantes." },
});
app.use(limiter);

// Rate limiting mais restrito para rotas de auth: 20 req/min
const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: "Muitas tentativas de autenticação. Aguarde 1 minuto." },
});

// ─── Body Parser ─────────────────────────────────────────────────────────────

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Health check ─────────────────────────────────────────────────────────────

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV ?? "development",
  });
});

// ─── Rotas ────────────────────────────────────────────────────────────────────

app.use("/auth", authLimiter, authRouter);
app.use("/profile", profileRouter);
app.use("/ongs", ongsRouter);
app.use("/acoes", acoesRouter);
app.use("/inscricoes", inscricoesRouter);
app.use("/voluntarios", voluntariosRouter);

// ─── 404 ─────────────────────────────────────────────────────────────────────

app.use((_req, res) => {
  res.status(404).json({ error: "Rota não encontrada." });
});

// ─── Error Handler ────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`\n🚀 connect-contribute-api rodando em http://localhost:${PORT}`);
  console.log(`   Ambiente: ${process.env.NODE_ENV ?? "development"}`);
  console.log(`   CORS permitido para: ${FRONTEND_URL}\n`);
});

export default app;
