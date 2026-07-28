/** Konum metninden koordinat çöz (Nominatim) */
export async function geocodeText(
  query: string,
): Promise<{ latitude: number; longitude: number } | null> {
  const q = query.trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Pazaryeri/1.0 (contact@pazaryerim.com)' },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ lat?: string; lon?: string }>;
    const hit = data[0];
    if (!hit?.lat || !hit.lon) return null;
    const latitude = Number(hit.lat);
    const longitude = Number(hit.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
    return { latitude, longitude };
  } catch {
    return null;
  }
}

export function buildGeocodeQuery(parts: {
  district?: string | null;
  city?: string | null;
  location?: string | null;
}): string {
  const location = parts.location?.trim();
  if (location) {
    if (/türkiye|turkey/i.test(location)) return location;
    return `${location}, Türkiye`;
  }
  const bits = [parts.district, parts.city]
    .filter((s) => s && String(s).trim())
    .map((s) => String(s).trim());
  const unique = [...new Set(bits)];
  return [...unique, "Türkiye"].join(", ");
}
