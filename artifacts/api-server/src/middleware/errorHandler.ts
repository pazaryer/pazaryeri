import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod/v4";
import { logger } from "../lib/logger";

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
    logger.error({ err, message: err.message, stack: err.stack }, "API error");
    const status = (err as { status?: number }).status ?? 500;
    res.status(status).json({ error: err.message });
    return;
  }

  logger.error({ err }, "Unknown API error");
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
