import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required");
  }
  if (!admin) {
    admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return admin;
}

export type DbUser = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  avatar: string | null;
  bio: string | null;
  city: string | null;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  total_sales: number;
  is_verified: boolean;
  push_token: string | null;
  created_at: string;
  updated_at: string;
};

export type DbListing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: string;
  city: string | null;
  district: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  accepts_offers: boolean;
  views: number;
  created_at: string;
  updated_at: string;
};

export type DbListingImage = {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
};

export function formatUser(u: DbUser) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    name: u.name,
    avatar: u.avatar,
    bio: u.bio,
    city: u.city,
    district: u.district,
    rating: u.rating,
    totalSales: u.total_sales,
    isVerified: u.is_verified,
    createdAt: u.created_at,
  };
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
  const km = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
}

export async function ensureUser(
  id: string,
  data?: { name?: string; email?: string; phone?: string; avatar?: string },
): Promise<DbUser> {
  const sb = getSupabaseAdmin();
  const { data: existing } = await sb.from("users").select("*").eq("id", id).single();

  if (existing) return existing as DbUser;

  const { data: created, error } = await sb
    .from("users")
    .insert({
      id,
      name: data?.name ?? "Kullanıcı",
      email: data?.email ?? null,
      phone: data?.phone ?? null,
      avatar: data?.avatar ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return created as DbUser;
}

export async function getListingImages(listingIds: string[]) {
  const map = new Map<string, string[]>();
  if (!listingIds.length) return map;

  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("listing_images")
    .select("*")
    .in("listing_id", listingIds)
    .order("sort_order");

  for (const img of data ?? []) {
    const list = map.get(img.listing_id) ?? [];
    list.push(img.url);
    map.set(img.listing_id, list);
  }
  return map;
}

export async function getFavoriteSet(userId: string | undefined, listingIds: string[]) {
  const set = new Set<string>();
  if (!userId || !listingIds.length) return set;

  const sb = getSupabaseAdmin();
  const { data } = await sb
    .from("favorites")
    .select("listing_id")
    .eq("user_id", userId)
    .in("listing_id", listingIds);

  for (const f of data ?? []) set.add(f.listing_id);
  return set;
}

export async function formatListingSummary(
  listing: DbListing,
  seller: DbUser,
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
    createdAt: listing.created_at,
    seller: {
      id: seller.id,
      name: seller.name,
      avatar: seller.avatar,
      isVerified: seller.is_verified,
    },
  };
}
