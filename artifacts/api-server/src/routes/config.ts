import { Router, type IRouter } from "express";
import { getAppConfig } from "../lib/app-config";
import { mergeBrandingBundle } from "../lib/branding";
import { mergeAdMobConfig } from "../lib/mobile-admob";

const router: IRouter = Router();

function withPublicConfigOverrides(config: Record<string, unknown>): Record<string, unknown> {
  return {
    ...config,
    "mobile.admob": mergeAdMobConfig(config),
  };
}

router.get("/config", async (_req, res, next) => {
  try {
    const raw = await getAppConfig();
    const config = withPublicConfigOverrides(raw);
    res.json({ config, updatedAt: new Date().toISOString() });
  } catch (err) {
    next(err);
  }
});

router.get("/config/branding", async (_req, res, next) => {
  try {
    const config = await getAppConfig();
    res.json({ branding: mergeBrandingBundle(config), updatedAt: new Date().toISOString() });
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
