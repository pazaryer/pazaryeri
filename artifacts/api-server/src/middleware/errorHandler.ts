import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod/v4";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Geçersiz istek",
      details: err.issues.map((i) => i.message),
    });
    return;
  }

  if (err instanceof Error) {
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: err.message });
    return;
  }

  res.status(500).json({ error: "Sunucu hatası" });
}

export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
    this.name = "AppError";
  }
}
