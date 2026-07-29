import {
  getSupabaseAdmin,
  ensureUser,
  formatListingSummary,
  getFavoriteSet,
  getFavoriteCountsMap,
  getListingImages,
  formatUser,
  supabaseHealthCheck,
  type DbListing,
  type DbUser,
} from "./supabase-db";
import { filterByRadius } from "./geo";
import { buildGeocodeQuery, geocodeText } from "./geocode";
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
  pgUpdateListingCoords,
} from "./postgres-db";
import { AppError } from "../middleware/errorHandler";
import { resolveListingPriceForViewer } from "./listing-price";

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

export async function withResolvedListingCoords<T extends {
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  location?: string;
}>(body: T): Promise<T> {
  if (body.latitude != null && body.longitude != null) return body;
  const coords = await geocodeText(buildGeocodeQuery(body));
  if (!coords) return body;
  return { ...body, latitude: coords.latitude, longitude: coords.longitude };
}

type CoordsRow = {
  id: string;
  latitude?: number | null;
  longitude?: number | null;
  city?: string | null;
  district?: string | null;
  location?: string | null;
};

/** Koordinatsız ilanları geocode edip veritabanına yazar */
async function hydrateListingCoords(
  listings: CoordsRow[],
  backend: ListingsBackend,
): Promise<void> {
  const sb = backend === "supabase" ? getSupabaseAdmin() : null;
  for (const listing of listings) {
    if (listing.latitude != null && listing.longitude != null) continue;
    const coords = await geocodeText(buildGeocodeQuery(listing));
    if (!coords) continue;
    listing.latitude = coords.latitude;
    listing.longitude = coords.longitude;
    if (backend === "postgres") {
      await pgUpdateListingCoords(listing.id, coords.latitude, coords.longitude);
    } else if (sb) {
      await sb
        .from("listings")
        .update({ latitude: coords.latitude, longitude: coords.longitude })
        .eq("id", listing.id);
    }
  }
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
  const resolved = await withResolvedListingCoords(body);
  if (backend === "postgres") {
    const id = await pgCreateListing(sellerId, resolved);
    return dbBuildListingDetail(id, sellerId);
  }

  await ensureUser(sellerId);
  const sb = getSupabaseAdmin();
  const { data: listing, error } = await sb
    .from("listings")
    .insert({
      seller_id: sellerId,
      title: resolved.title,
      price: resolved.price,
      category: resolved.category,
      description: resolved.description,
      city: resolved.city,
      district: resolved.district,
      location: resolved.location,
      latitude: resolved.latitude,
      longitude: resolved.longitude,
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
  sort?: "date_desc" | "date_asc" | "price_asc" | "price_desc";
  offset?: number;
}) {
  const backend = await resolveListingsBackend();
  if (backend === "postgres") {
    return pgListListings(params);
  }

  const sb = getSupabaseAdmin();
  const limit = params.limit;
  const sort = params.sort ?? "date_desc";
  const useOffset = sort.startsWith("price_") || sort === "date_asc";

  let query = sb
    .from("listings")
    .select("*, users!listings_seller_id_fkey(*)")
    .order(
      sort === "price_asc" || sort === "price_desc" ? "price" : "created_at",
      { ascending: sort === "price_asc" || sort === "date_asc" },
    );

  if (sort === "price_asc" || sort === "price_desc") {
    query = query.order("created_at", { ascending: false });
  }

  if (!params.includeNonActive) query = query.eq("status", "active");
  else query = query.neq("status", "deleted");

  if (params.category && params.category !== "Tümü") query = query.eq("category", params.category);
  if (params.q) query = query.ilike("title", `%${params.q}%`);
  if (params.sellerId) query = query.eq("seller_id", params.sellerId);
  if (!useOffset && params.cursor) query = query.lt("created_at", params.cursor);
  if (params.city) query = query.ilike("city", `%${params.city}%`);
  if (params.district) query = query.ilike("district", `%${params.district}%`);
  if (params.minPrice != null) query = query.gte("price", params.minPrice);
  if (params.maxPrice != null) query = query.lte("price", params.maxPrice);

  const fetchLimit = params.radiusKm ? Math.min(limit * 20, 500) : limit + 1;
  const rangeFrom = useOffset ? (params.offset ?? 0) : 0;
  const rangeTo = useOffset ? rangeFrom + fetchLimit - 1 : fetchLimit - 1;
  query = query.range(rangeFrom, rangeTo);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  let filtered = rows ?? [];
  if (params.radiusKm && params.lat != null && params.lon != null) {
    await hydrateListingCoords(filtered as CoordsRow[], "supabase");
    filtered = filterByRadius(filtered as DbListing[], params.lat, params.lon, params.radiusKm);
  }

  const hasMore = filtered.length > limit;
  const page = hasMore ? filtered.slice(0, limit) : filtered;
  const listingIds = page.map((r) => r.id);
  const imageMap = await getListingImages(listingIds);
  const favSet = await getFavoriteSet(params.userId, listingIds);
  const favCounts = await getFavoriteCountsMap(listingIds);

  let userLat: number | null = params.lat ?? null;
  let userLon: number | null = params.lon ?? null;
  if ((userLat == null || userLon == null) && params.userId) {
    const { data: me } = await sb.from("users").select("latitude, longitude").eq("id", params.userId).single();
    userLat = userLat ?? me?.latitude ?? null;
    userLon = userLon ?? me?.longitude ?? null;
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
        favCounts.get(row.id) ?? 0,
        params.userId,
      ),
    ),
  );

  return {
    items,
    hasMore,
    nextCursor: hasMore && !useOffset ? page[page.length - 1].created_at : null,
    nextOffset: hasMore && useOffset ? rangeFrom + limit : null,
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
  const favCounts = await getFavoriteCountsMap([listing.id]);

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
    favCounts.get(listing.id) ?? 0,
    userId,
  );

  const priceInfo = resolveListingPriceForViewer(listing as DbListing, userId);

  return {
    ...summary,
    price: priceInfo.price,
    originalPrice: priceInfo.originalPrice,
    hasNegotiatedPrice: priceInfo.hasNegotiatedPrice,
    description: listing.description,
    images,
    acceptsOffers: listing.accepts_offers,
    contactPhone: listing.contact_phone,
    sellerId: listing.seller_id,
    latitude: listing.latitude,
    longitude: listing.longitude,
    seller: formatUser(seller as DbUser),
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
