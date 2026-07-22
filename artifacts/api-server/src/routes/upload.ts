import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { authMiddleware } from "../middleware/auth";
import { createPresignedUploadUrl } from "../lib/r2";

const router: IRouter = Router();

const presignSchema = z.object({
  contentType: z.string().default("image/jpeg"),
});

router.post("/upload/presign", authMiddleware, async (req, res, next) => {
  try {
    const { contentType } = presignSchema.parse(req.body);
    const result = await createPresignedUploadUrl(req.user!.id, contentType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
