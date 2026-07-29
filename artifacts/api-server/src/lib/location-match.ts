import { listProvinces } from "./turkiye-locations.js";

const TR_FROM = "İIıĞğÜüŞşÖöÇç";
const TR_TO = "iiigguussoocc";

/** Türkçe karakterleri ASCII'ye indirger; İstanbul ↔ Istanbul eşleşmesi için. */
export function foldTrLocation(s: string): string {
  let out = s.trim().toLocaleLowerCase("tr-TR");
  for (let i = 0; i < TR_FROM.length; i++) {
    out = out.replaceAll(TR_FROM[i]!, TR_TO[i]!);
  }
  return out;
}

export function locationLikeParam(value: string): string {
  const cleaned = value.replace(/[%_]/g, "");
  return `%${foldTrLocation(cleaned)}%`;
}

/** PostgreSQL: ILIKE + translate ile Türkçe/ASCII varyantları eşleştirir. */
export function sqlLocationFieldMatch(column: string, paramIndex: number): string {
  const norm = (col: string) =>
    `lower(translate(COALESCE(${col}, ''), '${TR_FROM}', '${TR_TO}'))`;
  return `${norm(column)} LIKE ${norm(`$${paramIndex}`)}`;
}

/** Supabase/PostgREST için İ↔I varyantları. */
export function locationMatchVariants(term: string): string[] {
  const cleaned = term.replace(/[%_,]/g, "").trim();
  if (!cleaned) return [];
  const variants = new Set<string>([cleaned]);
  variants.add(cleaned.replace(/İ/g, "I").replace(/ı/g, "i"));
  variants.add(cleaned.replace(/I/g, "İ").replace(/i/g, "ı"));
  variants.add(foldTrLocation(cleaned));
  return [...variants].filter(Boolean);
}

export function normalizeListingCity(city: string | undefined): string | undefined {
  if (!city?.trim()) return undefined;
  const folded = foldTrLocation(city);
  const match = listProvinces().find((p) => foldTrLocation(p.name) === folded);
  return match?.name ?? city.trim();
}

export function listingMatchesLocationFilter(
  row: { city?: string | null; district?: string | null; location?: string | null },
  filter: { city?: string; district?: string; neighborhood?: string },
): boolean {
  if (filter.city) {
    const term = foldTrLocation(filter.city.replace(/[%_]/g, ""));
    const hit =
      [row.city, row.district, row.location].some(
        (v) => v && foldTrLocation(v).includes(term),
      );
    if (!hit) return false;
  }
  if (filter.district) {
    const term = foldTrLocation(filter.district.replace(/[%_]/g, ""));
    const hit = [row.district, row.location].some((v) => v && foldTrLocation(v).includes(term));
    if (!hit) return false;
  }
  if (filter.neighborhood) {
    const term = foldTrLocation(filter.neighborhood.replace(/[%_]/g, ""));
    if (!row.location || !foldTrLocation(row.location).includes(term)) return false;
  }
  return true;
}
