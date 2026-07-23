import { uploadToImgBB, isImgBBConfigured, getImgBBKeyCount } from "./imgbb-upload";

export type ImageStorageProvider = "imgbb";

export function getConfiguredImageProviders(): ImageStorageProvider[] {
  return isImgBBConfigured() ? ["imgbb"] : [];
}

/** Yalnızca ImgBB — R2/Supabase SSL hatalarından kaçınmak için */
export async function storeListingImage(
  userId: string,
  buffer: Buffer,
  contentType: string,
): Promise<{ publicUrl: string; provider: ImageStorageProvider }> {
  void userId;
  void contentType;

  if (!isImgBBConfigured()) {
    throw new Error("ImgBB yapılandırılmamış");
  }

  const publicUrl = await uploadToImgBB(buffer, contentType);
  return { publicUrl, provider: "imgbb" };
}

export function getImageStorageStatus() {
  return {
    ok: isImgBBConfigured(),
    primary: "imgbb" as const,
    providers: getConfiguredImageProviders(),
    imgbbKeys: getImgBBKeyCount(),
    storage: "imgbb",
  };
}
