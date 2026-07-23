import { randomUUID } from "crypto";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = "listings";

export async function uploadToSupabaseStorage(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("Supabase depolama yapılandırması eksik");
  }

  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const path = `${userId}/${randomUUID()}.${ext}`;
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`;

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: buffer,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(
      detail.includes("Bucket not found")
        ? "Depolama alanı hazır değil — Supabase Storage bucket oluşturun"
        : `Fotoğraf yüklenemedi (${res.status})`,
    );
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;
}
