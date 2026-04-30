import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("[ErrorHandler]", err);

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Dados inválidos.",
      details: err.errors.map((e) => ({
        campo: e.path.join("."),
        mensagem: e.message,
      })),
    });
    return;
  }

  if (err instanceof Error) {
    res.status(500).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Erro interno do servidor." });
}
