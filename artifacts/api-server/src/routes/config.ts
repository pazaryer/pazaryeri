import { Router, type IRouter } from "express";
import { getAppConfig } from "../lib/app-config";

const router: IRouter = Router();

router.get("/config", async (_req, res, next) => {
  try {
    const config = await getAppConfig();
    res.json({ config, updatedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

router.get("/config/:key", async (req, res, next) => {
  try {
    const key = Array.isArray(req.params.key) ? req.params.key[0]! : req.params.key;
    const config = await getAppConfig(key);
    res.json(config);
  } catch (err) {
    next(err);
  }
});

export default router;
