import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { authMiddleware } from "../middleware/auth";
import { getImageStorageStatus, storeListingImage } from "../lib/image-storage";
import { AppError } from "../middleware/errorHandler";

const router: IRouter = Router();

const imageUploadSchema = z.object({
  contentType: z.string().default("image/jpeg"),
  data: z.string().min(1),
});

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

async function handleImageUpload(
  req: import("express").Request,
  res: import("express").Response,
  next: import("express").NextFunction,
): Promise<void> {
  try {
    const { contentType, data } = imageUploadSchema.parse(req.body);
    const buffer = Buffer.from(data, "base64");
    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new AppError("Fotoğraf çok büyük (maks. 8 MB)", 400);
    }
    if (buffer.length < 100) {
      throw new AppError("Geçersiz fotoğraf verisi", 400);
    }

    const { publicUrl, provider } = await storeListingImage(
      req.user!.id,
      buffer,
      contentType,
    );
    res.json({ publicUrl, provider });
  } catch (err) {
    next(err);
  }
}

router.get("/upload/status", (_req, res) => {
  res.json(getImageStorageStatus());
});

/** Web/mobil — base64 fotoğraf → ImgBB */
router.post("/upload/image", authMiddleware, handleImageUpload);
router.post("/images/upload", authMiddleware, handleImageUpload);

export default router;
