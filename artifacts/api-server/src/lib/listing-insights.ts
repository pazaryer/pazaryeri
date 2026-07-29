import { getSupabaseAdmin } from "./supabase-db";
import { AppError } from "../middleware/errorHandler";
import { isPostgresConfigured, getPgPool } from "./postgres-db";

export type ListingFavoriter = {
  userId: string;
  name: string;
  avatar: string | null;
  favoritedAt: string;
};

export type ListingViewer = {
  userId: string | null;
  name: string;
  avatar: string | null;
  viewedAt: string;
  isAnonymous: boolean;
};

export type ListingInsights = {
  favoriteCount: number;
  viewCount: number;
  favoriters: ListingFavoriter[];
  viewers: ListingViewer[];
};

async function assertListingOwner(listingId: string, userId: string): Promise<{ viewCount: number }> {
  if (isPostgresConfigured()) {
    const db = getPgPool();
    const { rows } = await db.query<{ seller_id: string; views: number }>(
      "SELECT seller_id, views FROM listings WHERE id = $1",
      [listingId],
    );
    const row = rows[0];
    if (!row) throw new AppError("İlan bulunamadı", 404);
    if (row.seller_id !== userId) throw new AppError("Yetkisiz", 403);
    return { viewCount: row.views };
  }

  const sb = getSupabaseAdmin();
  const { data: listing } = await sb
    .from("listings")
    .select("seller_id, views")
    .eq("id", listingId)
    .single();
  if (!listing) throw new AppError("İlan bulunamadı", 404);
  if (listing.seller_id !== userId) throw new AppError("Yetkisiz", 403);
  return { viewCount: listing.views ?? 0 };
}

export async function getListingInsights(listingId: string, userId: string): Promise<ListingInsights> {
  const { viewCount } = await assertListingOwner(listingId, userId);

  if (isPostgresConfigured()) {
    const db = getPgPool();

    const favoritersRes = await db.query<{
      user_id: string;
      created_at: string;
      name: string;
      avatar: string | null;
    }>(
      `SELECT f.user_id, f.created_at, u.name, u.avatar
       FROM favorites f
       JOIN users u ON u.id = f.user_id
       WHERE f.listing_id = $1
       ORDER BY f.created_at DESC
       LIMIT 200`,
      [listingId],
    );

    const viewersRes = await db.query<{
      user_id: string | null;
      created_at: string;
      name: string | null;
      avatar: string | null;
    }>(
      `SELECT lv.user_id, lv.created_at, u.name, u.avatar
       FROM listing_views lv
       LEFT JOIN users u ON u.id = lv.user_id
       WHERE lv.listing_id = $1
       ORDER BY lv.created_at DESC
       LIMIT 200`,
      [listingId],
    );

    const favoriters: ListingFavoriter[] = favoritersRes.rows.map((r) => ({
      userId: r.user_id,
      name: r.name,
      avatar: r.avatar,
      favoritedAt: r.created_at,
    }));

    const viewers: ListingViewer[] = viewersRes.rows.map((r) => ({
      userId: r.user_id,
      name: r.user_id ? (r.name ?? "Kullanıcı") : "Misafir ziyaretçi",
      avatar: r.user_id ? r.avatar : null,
      viewedAt: r.created_at,
      isAnonymous: !r.user_id,
    }));

    return {
      favoriteCount: favoriters.length,
      viewCount,
      favoriters,
      viewers,
    };
  }

  const sb = getSupabaseAdmin();

  const { data: favs } = await sb
    .from("favorites")
    .select("user_id, created_at, users!favorites_user_id_fkey(id, name, avatar)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(200);

  const favoriters: ListingFavoriter[] = (favs ?? []).map((f) => {
    const u = f.users as { name?: string; avatar?: string | null } | null;
    return {
      userId: f.user_id,
      name: u?.name ?? "Kullanıcı",
      avatar: u?.avatar ?? null,
      favoritedAt: f.created_at,
    };
  });

  const { data: views } = await sb
    .from("listing_views")
    .select("user_id, created_at, users(id, name, avatar)")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false })
    .limit(200);

  const viewers: ListingViewer[] = (views ?? []).map((v) => {
    const u = v.user_id ? (v.users as { name?: string; avatar?: string | null } | null) : null;
    return {
      userId: v.user_id ?? null,
      name: v.user_id ? (u?.name ?? "Kullanıcı") : "Misafir ziyaretçi",
      avatar: v.user_id ? (u?.avatar ?? null) : null,
      viewedAt: v.created_at,
      isAnonymous: !v.user_id,
    };
  });

  return {
    favoriteCount: favoriters.length,
    viewCount,
    favoriters,
    viewers,
  };
}
