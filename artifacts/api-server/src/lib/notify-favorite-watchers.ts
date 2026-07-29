import { getSupabaseAdmin } from "./supabase-db";
import { notifyUser } from "./notify";
import { logger } from "./logger";

export type FavoriteChangeType = "price_drop" | "image_added" | "sold" | "updated";

function formatPrice(price: number): string {
  return `₺${price.toLocaleString("tr-TR")}`;
}

export async function notifyListingFavoriters(
  listingId: string,
  sellerId: string,
  params: {
    changeType: FavoriteChangeType;
    oldPrice?: number;
    newPrice?: number;
    imageCount?: number;
  },
): Promise<void> {
  const sb = getSupabaseAdmin();

  const [{ data: listing }, { data: favoriters }] = await Promise.all([
    sb.from("listings").select("title, price").eq("id", listingId).single(),
    sb.from("favorites").select("user_id").eq("listing_id", listingId),
  ]);

  if (!listing || !favoriters?.length) return;

  const listingTitle = listing.title ?? "İlan";
  let title = "Favori ilan güncellendi";
  let body = `"${listingTitle}" ilanında değişiklik var`;

  switch (params.changeType) {
    case "price_drop":
      title = "Fiyat düştü! 📉";
      body =
        params.newPrice != null
          ? `"${listingTitle}" — ${formatPrice(params.newPrice)} oldu`
          : `"${listingTitle}" fiyatı düştü`;
      break;
    case "image_added":
      title = "Yeni fotoğraf eklendi 📷";
      body = `"${listingTitle}" ilanına yeni görsel eklendi`;
      break;
    case "sold":
      title = "Favori ilan satıldı";
      body = `"${listingTitle}" satıldı — kaçırmış olabilirsiniz`;
      break;
    case "updated":
      title = "İlan güncellendi";
      body = `"${listingTitle}" ilanı güncellendi`;
      break;
  }

  for (const row of favoriters) {
    if (row.user_id === sellerId) continue;
    try {
      await notifyUser({
        userId: row.user_id,
        type: "favorite_update",
        title,
        subtitle: listingTitle,
        body,
        data: {
          listingId,
          listingTitle,
          changeType: params.changeType,
          newPrice: params.newPrice != null ? String(params.newPrice) : "",
        },
      });
    } catch (err) {
      logger.warn({ err, userId: row.user_id, listingId }, "notifyListingFavoriters failed");
    }
  }
}
