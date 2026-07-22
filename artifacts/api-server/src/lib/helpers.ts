import { eq, sql, and, or, desc, lt, ilike, gte, lte, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  usersTable,
  listingsTable,
  listingImagesTable,
  favoritesTable,
} from "@workspace/db/schema";

export function formatPrice(price: number): string {
  return `₺${price.toLocaleString("tr-TR")}`;
}

export function formatTimeAgo(date: Date): string {
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} hafta önce`;
  return date.toLocaleDateString("tr-TR");
}

export function calcDistance(
  lat1?: number | null,
  lon1?: number | null,
  lat2?: number | null,
  lon2?: number | null,
): string | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export async function ensureUser(
  id: string,
  data?: { name?: string; email?: string; phone?: string; avatar?: string },
) {
  const existing = await db.query.usersTable.findFirst({
    where: eq(usersTable.id, id),
  });

  if (existing) return existing;

  const [user] = await db
    .insert(usersTable)
    .values({
      id,
      name: data?.name ?? "Kullanıcı",
      email: data?.email,
      phone: data?.phone,
      avatar: data?.avatar,
    })
    .returning();

  return user;
}

export async function getListingImages(listingIds: string[]) {
  if (listingIds.length === 0) return new Map<string, string[]>();

  const images = await db
    .select()
    .from(listingImagesTable)
    .where(inArray(listingImagesTable.listingId, listingIds))
    .orderBy(listingImagesTable.sortOrder);

  const map = new Map<string, string[]>();
  for (const img of images) {
    const list = map.get(img.listingId) ?? [];
    list.push(img.url);
    map.set(img.listingId, list);
  }
  return map;
}

export async function getFavoriteSet(userId: string | undefined, listingIds: string[]) {
  if (!userId || listingIds.length === 0) return new Set<string>();

  const favs = await db
    .select({ listingId: favoritesTable.listingId })
    .from(favoritesTable)
    .where(
      and(
        eq(favoritesTable.userId, userId),
        inArray(favoritesTable.listingId, listingIds),
      ),
    );

  return new Set(favs.map((f) => f.listingId));
}

export async function formatListingSummary(
  listing: typeof listingsTable.$inferSelect,
  seller: typeof usersTable.$inferSelect,
  image: string,
  isFavorite: boolean,
  userLat?: number | null,
  userLon?: number | null,
) {
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    category: listing.category,
    status: listing.status,
    city: listing.city,
    district: listing.district,
    location: listing.location,
    views: listing.views,
    isFavorite,
    distance: calcDistance(userLat, userLon, listing.latitude, listing.longitude),
    image,
    createdAt: listing.createdAt.toISOString(),
    seller: {
      id: seller.id,
      name: seller.name,
      avatar: seller.avatar,
      isVerified: seller.isVerified,
    },
  };
}

export { eq, sql, and, or, desc, lt, ilike, gte, lte, inArray };
