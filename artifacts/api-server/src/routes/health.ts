import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { isPostgresConfigured, isPostgresAvailable, pgHealthCheck } from "../lib/postgres-db";
import { getImageStorageStatus } from "../lib/image-storage";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  const data = HealthCheckResponse.parse({ status: "ok" });
  const dbOk = isPostgresConfigured() ? await pgHealthCheck() : null;
  res.json({
    ...data,
    db: dbOk,
    dbMode: dbOk ? "postgres" : "supabase",
    storage: getImageStorageStatus(),
  });
});

export default router;
