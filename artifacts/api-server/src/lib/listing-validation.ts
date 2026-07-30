import { z } from "zod/v4";

function normalizeImageUrl(raw: string): string {
  const trimmed = raw.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  return trimmed;
}

function parsePriceInput(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value === "string") {
    const digits = value.replace(/\D/g, "");
    if (!digits) return NaN;
    return parseInt(digits, 10);
  }
  return NaN;
}

function optionalFiniteNumber(value: unknown): number | undefined {
  if (typeof value !== "number" || !Number.isFinite(value)) return undefined;
  return value;
}

export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Başlık en az 3 karakter olmalı")
    .max(200, "Başlık en fazla 200 karakter olabilir"),
  price: z.preprocess(
    parsePriceInput,
    z
      .number({ error: "Geçerli bir fiyat girin" })
      .int()
      .min(0, "Fiyat 0 veya daha büyük olmalı"),
  ),
  category: z.string().trim().min(1, "Kategori seçin"),
  description: z.preprocess(
    (value) => (value == null ? "" : String(value)),
    z.string().max(5000),
  ),
  city: z.string().trim().optional(),
  district: z.string().trim().optional(),
  location: z.string().trim().optional(),
  latitude: z.preprocess(optionalFiniteNumber, z.number().optional()),
  longitude: z.preprocess(optionalFiniteNumber, z.number().optional()),
  acceptsOffers: z.boolean().default(true),
  contactPhone: z.string().trim().max(30).optional(),
  images: z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .transform(normalizeImageUrl)
        .refine((url) => /^https?:\/\/.+/i.test(url), "Geçersiz görsel URL"),
    )
    .min(1, "En az 1 fotoğraf gerekli")
    .max(10, "En fazla 10 fotoğraf eklenebilir"),
});

export const updateListingSchema = createListingSchema.partial();

export function formatZodIssueMessage(issue: { path: PropertyKey[]; message: string }): string {
  const path = issue.path.length > 0 ? `${String(issue.path[issue.path.length - 1])}: ` : "";
  const msg = issue.message;

  if (msg.includes("Too small") && issue.path[0] === "title") {
    return "Başlık en az 3 karakter olmalı";
  }
  if (issue.path[0] === "price") {
    return "Geçerli bir fiyat girin";
  }
  if (issue.path[0] === "images") {
    return "Fotoğraflar yüklenemedi. Lütfen fotoğrafları yeniden ekleyin.";
  }
  if (msg.includes("Geçersiz görsel URL")) {
    return "Fotoğraf adresi geçersiz. Lütfen fotoğrafları yeniden ekleyin.";
  }

  return `${path}${msg}`.replace(/^: /, "");
}
