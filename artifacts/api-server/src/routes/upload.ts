import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { randomUUID } from "crypto";
import { authMiddleware } from "../middleware/auth";
import { createPresignedUploadUrl, uploadBuffer } from "../lib/r2";
import { uploadToSupabaseStorage } from "../lib/storage-upload";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

const presignSchema = z.object({
  contentType: z.string().default("image/jpeg"),
});

const imageUploadSchema = z.object({
  contentType: z.string().default("image/jpeg"),
  data: z.string().min(1),
});

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function storeImage(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const ext = contentType.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
  const key = `listings/${userId}/${randomUUID()}.${ext}`;

  try {
    return await uploadBuffer(key, buffer, contentType);
  } catch (r2Err) {
    try {
      return await uploadToSupabaseStorage(userId, buffer, contentType);
    } catch (supabaseErr) {
      const r2Msg = r2Err instanceof Error ? r2Err.message : "R2 hatası";
      const sbMsg =
        supabaseErr instanceof Error ? supabaseErr.message : "Supabase hatası";
      throw new AppError(`Fotoğraf depolanamadı: ${r2Msg} / ${sbMsg}`, 500);
    }
  }
}

router.post("/upload/presign", authMiddleware, async (req, res, next) => {
  try {
    const { contentType } = presignSchema.parse(req.body);
    const result = await createPresignedUploadUrl(req.user!.id, contentType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

/** Web tarayıcısından doğrudan yükleme (R2 CORS sorunu olmadan) */
router.post("/upload/image", authMiddleware, async (req, res, next) => {
  try {
    const { contentType, data } = imageUploadSchema.parse(req.body);
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new AppError("Fotoğraf çok büyük (maks. 8 MB)", 400);
    }
    if (buffer.length < 100) {
      throw new AppError("Geçersiz fotoğraf verisi", 400);
    }

    const publicUrl = await storeImage(req.user!.id, buffer, contentType);
    res.json({ publicUrl });
  } catch (err) {
    next(err);
  }
});

export default router;
