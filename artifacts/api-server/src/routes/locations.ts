import { Router, type IRouter } from "express";
import {
  filterDistricts,
  filterProvinces,
  findDistrictId,
  listDistricts,
  listNeighborhoods,
  listProvinces,
} from "../lib/turkiye-locations";

const router: IRouter = Router();

router.get("/locations/provinces", (_req, res) => {
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.json({ items: listProvinces() });
});

router.get("/locations/districts", (req, res) => {
  const province = req.query.province as string | undefined;
  const provinceId = req.query.provinceId ? Number(req.query.provinceId) : undefined;
  res.setHeader("Cache-Control", "public, max-age=86400");
  res.json({ items: listDistricts(province, provinceId) });
});

router.get("/locations/neighborhoods", async (req, res, next) => {
  try {
    const districtId = req.query.districtId ? Number(req.query.districtId) : undefined;
    const province = req.query.province as string | undefined;
    const district = req.query.district as string | undefined;
    const q = (req.query.q as string | undefined)?.trim();
    const limit = Math.min(Number(req.query.limit) || 80, 200);

    let resolvedDistrictId = districtId;
    if (!resolvedDistrictId && province && district) {
      resolvedDistrictId = findDistrictId(province, district) ?? undefined;
    }
    if (!resolvedDistrictId) {
      res.status(400).json({ error: "districtId veya province+district gerekli" });
      return;
    }

    const items = await listNeighborhoods(resolvedDistrictId, q, limit);
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.get("/locations/suggest/provinces", (req, res) => {
  const q = String(req.query.q ?? "");
  res.json({ items: filterProvinces(q) });
});

router.get("/locations/suggest/districts", (req, res) => {
  const province = String(req.query.province ?? "");
  const q = String(req.query.q ?? "");
  if (!province) {
    res.status(400).json({ error: "province gerekli" });
    return;
  }
  res.json({ items: filterDistricts(province, q) });
});

export default router;
