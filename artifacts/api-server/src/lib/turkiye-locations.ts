import provincesRaw from "../data/provinces-data.json" with { type: "json" };

type ProvinceRow = { id: number; name: string };
type DistrictRow = { id: number; name: string };
type ProvinceBundle = { id: number; name: string; districts: DistrictRow[] };

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const neighborhoodCache = new Map<string, { expires: number; items: string[] }>();

let provincesBundle: ProvinceBundle[] | null = null;

function loadProvinces(): ProvinceBundle[] {
  if (provincesBundle) return provincesBundle;
  const parsed = provincesRaw as { data: Array<{ id: number; name: string; districts: DistrictRow[] }> };
  provincesBundle = parsed.data.map((p) => ({
    id: p.id,
    name: p.name,
    districts: (p.districts ?? []).map((d) => ({ id: d.id, name: d.name })),
  }));
  return provincesBundle;
}

function normalizeTr(s: string): string {
  return s.trim().toLocaleLowerCase("tr-TR");
}

export function listProvinces(): Array<{ id: number; name: string }> {
  return loadProvinces().map((p) => ({ id: p.id, name: p.name }));
}

export function listDistricts(province?: string, provinceId?: number): DistrictRow[] {
  const all = loadProvinces();
  if (provinceId != null) {
    return all.find((p) => p.id === provinceId)?.districts ?? [];
  }
  if (province) {
    const q = normalizeTr(province);
    return all.find((p) => normalizeTr(p.name) === q)?.districts ?? [];
  }
  return [];
}

export function findDistrictId(province: string, district: string): number | null {
  const districts = listDistricts(province);
  const q = normalizeTr(district);
  return districts.find((d) => normalizeTr(d.name) === q)?.id ?? null;
}

export async function listNeighborhoods(
  districtId: number,
  query?: string,
  limit = 80,
): Promise<string[]> {
  const cacheKey = `${districtId}:${query ?? ""}:${limit}`;
  const cached = neighborhoodCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) return cached.items;

  const url = new URL(`https://api.turkiyeapi.dev/v2/districts/${districtId}/neighborhoods`);
  url.searchParams.set("limit", String(Math.min(limit, 200)));
  if (query?.trim()) url.searchParams.set("name", query.trim());

  const res = await fetch(url.toString(), {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(12_000),
  });
  if (!res.ok) throw new Error("Mahalle listesi alınamadı");

  const body = (await res.json()) as { data?: Array<{ name: string }> };
  const items = (body.data ?? []).map((n) => n.name).slice(0, limit);

  neighborhoodCache.set(cacheKey, { items, expires: Date.now() + CACHE_TTL_MS });
  return items;
}

export function filterProvinces(query: string, limit = 12): string[] {
  const q = normalizeTr(query);
  const names = listProvinces().map((p) => p.name);
  if (!q) return names.slice(0, limit);
  return names.filter((n) => normalizeTr(n).includes(q)).slice(0, limit);
}

export function filterDistricts(province: string, query: string, limit = 12): string[] {
  const q = normalizeTr(query);
  const names = listDistricts(province).map((d) => d.name);
  if (!q) return names.slice(0, limit);
  return names.filter((n) => normalizeTr(n).includes(q)).slice(0, limit);
}
