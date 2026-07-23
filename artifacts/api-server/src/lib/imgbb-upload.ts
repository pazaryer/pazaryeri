const IMGBB_UPLOAD_URL = "https://api.imgbb.com/1/upload";

/** Render ortam değişkeni yoksa kullanılır (kullanıcı tarafından sağlandı) */
const DEFAULT_IMGBB_KEYS = [
  "91caa7c6b5720d1f1351e502086cf720",
  "235ba2b98ebf0e39333f19e0756bc842",
];

let keyIndex = 0;

function getImgBBApiKeys(): string[] {
  const keys = new Set<string>();
  const multi = process.env.IMGBB_API_KEYS?.trim();
  const single = process.env.IMGBB_API_KEY?.trim();

  if (multi) {
    for (const part of multi.split(/[,;\s]+/)) {
      const k = part.trim();
      if (k) keys.add(k);
    }
  }
  if (single) keys.add(single);

  if (keys.size === 0) {
    for (const k of DEFAULT_IMGBB_KEYS) keys.add(k);
  }

  return [...keys];
}

type ImgBBResponse = {
  success?: boolean;
  status?: number;
  error?: { message?: string };
  data?: { url?: string; display_url?: string; image?: { url?: string } };
};

async function uploadWithKey(
  apiKey: string,
  buffer: Buffer,
): Promise<string> {
  const body = new URLSearchParams();
  body.set("key", apiKey);
  body.set("image", buffer.toString("base64"));

  const res = await fetch(IMGBB_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
    signal: AbortSignal.timeout(60_000),
  });

  const json = (await res.json().catch(() => null)) as ImgBBResponse | null;

  if (!res.ok || !json?.success) {
    const msg =
      json?.error?.message ??
      (typeof json === "object" && json !== null ? JSON.stringify(json) : res.statusText);
    throw new Error(msg);
  }

  const url =
    json.data?.url ?? json.data?.display_url ?? json.data?.image?.url;
  if (!url) {
    throw new Error("ImgBB yanıtında görsel URL yok");
  }

  return url;
}

/** ImgBB — tek fotoğraf depolama. Çoklu key ile yük dağılımı. */
export async function uploadToImgBB(
  buffer: Buffer,
  _contentType?: string,
): Promise<string> {
  const keys = getImgBBApiKeys();
  if (keys.length === 0) {
    throw new Error("ImgBB API anahtarı yapılandırılmamış");
  }

  const start = keyIndex % keys.length;
  keyIndex = (keyIndex + 1) % keys.length;
  const order = [...keys.slice(start), ...keys.slice(0, start)];

  const errors: string[] = [];
  for (const apiKey of order) {
    try {
      return await uploadWithKey(apiKey, buffer);
    } catch (err) {
      errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  throw new Error(`ImgBB: ${errors.join(" | ")}`);
}

export function isImgBBConfigured(): boolean {
  return getImgBBApiKeys().length > 0;
}

export function getImgBBKeyCount(): number {
  return getImgBBApiKeys().length;
}
