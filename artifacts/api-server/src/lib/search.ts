/** Arama terimini güvenli hale getirir (PostgREST/SQL injection önleme). */
export function sanitizeSearchQuery(raw: string): string {
  return raw
    .trim()
    .replace(/[%_,().*<>]/g, " ")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

export function searchPattern(raw: string): string {
  const q = sanitizeSearchQuery(raw);
  return q ? `%${q}%` : "";
}
