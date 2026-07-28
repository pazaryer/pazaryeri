import {
  getSupabaseAdmin,
  ensureUser,
  formatListingSummary,
  getFavoriteSet,
  getListingImages,
  formatUser,
  supabaseHealthCheck,
  type DbListing,
  type DbUser,
} from "./supabase-db";
import { filterByRadius } from "./geo";
import {
  isPostgresConfigured,
  pgHealthCheck,
  pgEnsureUser,
  pgCreateListing,
  pgListListings,
  pgBuildListingDetail,
  pgGetUser,
  pgUpdateUser,
  pgUpdatePushToken,
} from "./postgres-db";
import { AppError } from "../middleware/errorHandler";

export type ListingsBackend = "postgres" | "supabase";

let cachedBackend: ListingsBackend | null = null;
let cacheExpires = 0;

export async function resolveListingsBackend(): Promise<ListingsBackend> {
  const now = Date.now();
  if (cachedBackend && now < cacheExpires) return cachedBackend;

  if (isPostgresConfigured() && (await pgHealthCheck())) {
    cachedBackend = "postgres";
    cacheExpires = now + 60_000;
    return "postgres";
  }

  const supa = await supabaseHealthCheck();
  if (supa.ok) {
    cachedBackend = "supabase";
    cacheExpires = now + 60_000;
    return "supabase";
  }

  const hints: string[] = [];
  if (isPostgresConfigured()) hints.push("DATABASE_URL bağlantısı başarısız");
  if (supa.error?.includes("fetch failed")) {
    hints.push(
      "SUPABASE_URL yanlış veya proje kapalı — https://vqllsqrgwwzrehcegyot.supabase.co formatında olmalı",
    );
  } else if (supa.error) {
    hints.push(`Supabase: ${supa.error}`);
    if (supa.error.toLowerCase().includes("invalid api key")) {
      hints.push(
        "SUPABASE_SERVICE_ROLE_KEY yanlış — Supabase Dashboard → Settings → API → service_role anahtarını Render'a yapıştırın",
      );
    }
  } else {
    hints.push("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY Render'da eksik");
  }

  throw new AppError(`Veritabanı bağlantısı yok. ${hints.join(". ")}`, 503);
}

export async function dbEnsureUser(
  id: string,
  data?: { name?: string; email?: string; phone?: string; avatar?: string },
) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") return pgEnsureUser(id, data);
  return ensureUser(id, data);
}

export async function dbCreateListing(
  sellerId: string,
  body: {
    title: string;
    price: number;
    category: string;
    description: string;
    city?: string;
    district?: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    acceptsOffers: boolean;
    contactPhone?: string;
    images: string[];
  },
) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    const id = await pgCreateListing(sellerId, body);
    return dbBuildListingDetail(id, sellerId);
  }

  await ensureUser(sellerId);
  const sb = getSupabaseAdmin();
  const { data: listing, error } = await sb
    .from("listings")
    .insert({
      seller_id: sellerId,
      title: body.title,
      price: body.price,
      category: body.category,
      description: body.description,
      city: body.city,
      district: body.district,
      location: body.location,
      latitude: body.latitude,
      longitude: body.longitude,
      accepts_offers: body.acceptsOffers,
      contact_phone: body.contactPhone ?? null,
    })
    .select()
    .single();

  if (error || !listing) throw new Error(error?.message ?? "İlan oluşturulamadı");

  const { error: imgErr } = await sb.from("listing_images").insert(
    body.images.map((url, i) => ({ listing_id: listing.id, url, sort_order: i })),
  );
  if (imgErr) throw new Error(imgErr.message);

  return dbBuildListingDetail(listing.id, sellerId);
}

export async function dbListListings(params: {
  limit: number;
  category?: string;
  q?: string;
  cursor?: string;
  sellerId?: string;
  userId?: string;
  includeNonActive?: boolean;
  city?: string;
  district?: string;
  minPrice?: number;
  maxPrice?: number;
  radiusKm?: number;
  lat?: number;
  lon?: number;
}) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    return pgListListings(params);
  }

  const sb = getSupabaseAdmin();
  const limit = params.limit;

  let query = sb
    .from("listings")
    .select("*, users!listings_seller_id_fkey(*)")
    .order("created_at", { ascending: false });

  if (!params.includeNonActive) query = query.eq("status", "active");
  else query = query.neq("status", "deleted");

  if (params.category && params.category !== "Tümü") query = query.eq("category", params.category);
  if (params.q) query = query.ilike("title", `%${params.q}%`);
  if (params.sellerId) query = query.eq("seller_id", params.sellerId);
  if (params.cursor) query = query.lt("created_at", params.cursor);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.district) query = query.ilike("district", `%${params.district}%`);
  if (params.minPrice != null) query = query.gte("price", params.minPrice);
  if (params.maxPrice != null) query = query.lte("price", params.maxPrice);

  const fetchLimit = params.radiusKm ? Math.min(limit * 4, 100) : limit + 1;
  query = query.limit(fetchLimit);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  let filtered = rows ?? [];
  if (params.radiusKm && params.lat != null && params.lon != null) {
    filtered = filterByRadius(filtered as DbListing[], params.lat, params.lon, params.radiusKm);
  }

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  const listingIds = page.map((r) => r.id);
  const imageMap = await getListingImages(listingIds);
  const favSet = await getFavoriteSet(params.userId, listingIds);

  let userLat: number | null = null;
  let userLon: number | null = null;
  if (params.userId) {
    const { data: me } = await sb.from("users").select("latitude, longitude").eq("id", params.userId).single();
    userLat = me?.latitude ?? null;
    userLon = me?.longitude ?? null;
  }

  const items = await Promise.all(
    page.map((row) =>
      formatListingSummary(
        row as DbListing,
        row.users as DbUser,
        imageMap.get(row.id)?.[0] ?? "",
        favSet.has(row.id),
        userLat,
        userLon,
      ),
    ),
  );

  return {
    items,
    hasMore,
    nextCursor: hasMore ? page[page.length - 1].created_at : null,
  };
}

export async function dbBuildListingDetail(listingId: string, userId?: string) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    return pgBuildListingDetail(listingId, userId);
  }

  const sb = getSupabaseAdmin();
  const { data: listing, error } = await sb.from("listings").select("*").eq("id", listingId).single();
  if (error || !listing || listing.status === "deleted") throw new AppError("İlan bulunamadı", 404);

  const { data: seller } = await sb.from("users").select("*").eq("id", listing.seller_id).single();
  if (!seller) throw new AppError("Satıcı bulunamadı", 404);

  const imageMap = await getListingImages([listing.id]);
  const images = imageMap.get(listing.id) ?? [];
  const favSet = await getFavoriteSet(userId, [listing.id]);

  let userLat: number | null = null;
  let userLon: number | null = null;
  if (userId) {
    const { data: me } = await sb.from("users").select("latitude, longitude").eq("id", userId).single();
    userLat = me?.latitude ?? null;
    userLon = me?.longitude ?? null;
  }

  const summary = await formatListingSummary(
    listing as DbListing,
    seller as DbUser,
    images[0] ?? "",
    favSet.has(listing.id),
    userLat,
    userLon,
  );

  let favoriteCount: number | undefined;
  if (userId && userId === listing.seller_id) {
    const { count } = await sb
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("listing_id", listing.id);
    favoriteCount = count ?? 0;
  }

  return {
    ...summary,
    description: listing.description,
    images,
    acceptsOffers: listing.accepts_offers,
    contactPhone: listing.contact_phone,
    sellerId: listing.seller_id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    seller: formatUser(seller as DbUser),
    favoriteCount,
  };
}

export async function getListingsDbStatus() {
  const postgres = {
    configured: isPostgresConfigured(),
    ok: isPostgresConfigured() ? await pgHealthCheck() : false,
  };
  const supabase = await supabaseHealthCheck();
  let backend: ListingsBackend | "none" = "none";
  try {
    backend = await resolveListingsBackend();
  } catch {
    backend = "none";
  }
  return { backend, postgres, supabase };
}

export async function dbSyncUser(
  id: string,
  data?: { name?: string; email?: string; phone?: string; avatar?: string },
) {
  const user = await dbEnsureUser(id, data);
  return formatUser(user);
}

export async function dbGetUser(
  id: string,
  data?: { email?: string; phone?: string },
) {
  const backend = await resolveListingsBackend();
  let user: DbUser;
  if (backend === "postgres") {
    user = (await pgGetUser(id)) ?? (await pgEnsureUser(id, data));
  } else {
    user = await ensureUser(id, data);
  }
  return formatUser(user);
}

export async function dbUpdateUser(
  id: string,
  body: {
    name?: string;
    avatar?: string;
    phone?: string;
    bio?: string;
    city?: string;
    district?: string;
    latitude?: number;
    longitude?: number;
  },
) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    await pgEnsureUser(id);
    const user = await pgUpdateUser(id, body);
    return formatUser(user);
  }

  await ensureUser(id);
  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("users")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new AppError("Kullanıcı bulunamadı", 404);
  return formatUser(data as DbUser);
}

export async function dbGetUserById(userId: string) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    const user = await pgGetUser(userId);
    if (!user) throw new AppError("Kullanıcı bulunamadı", 404);
    return formatUser(user);
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb.from("users").select("*").eq("id", userId).single();
  if (error || !data) throw new AppError("Kullanıcı bulunamadı", 404);
  return formatUser(data as DbUser);
}

export async function dbUpdatePushToken(id: string, token: string) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    await pgUpdatePushToken(id, token);
    return;
  }
  await getSupabaseAdmin()
    .from("users")
    .update({ push_token: token, updated_at: new Date().toISOString() })
    .eq("id", id);
}
