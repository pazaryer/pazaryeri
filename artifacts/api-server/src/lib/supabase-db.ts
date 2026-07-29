import "./node-polyfills";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { notifyAdmins } from "./notify-admins";

const supabaseUrl = process.env.SUPABASE_URL?.replace(/\/$/, "") ?? "";
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
  process.env.SUPABASE_SECRET_KEY?.trim() ||
  "";

let admin: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli");
  }
  if (!supabaseUrl.startsWith("https://") || !supabaseUrl.includes(".supabase.co")) {
    throw new Error(
      "SUPABASE_URL geçersiz — https://PROJE_ID.supabase.co formatında olmalı (postgres bağlantı dizesi değil)",
    );
  }
  if (!admin) {
    admin = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      realtime: { enabled: false },
    });
  }
  return admin;
}

export async function supabaseHealthCheck(): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseUrl || !serviceKey) {
    return { ok: false, error: "SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik" };
  }
  if (!supabaseUrl.startsWith("https://")) {
    return { ok: false, error: "SUPABASE_URL https:// ile başlamalı" };
  }
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("listings").select("id").limit(1);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
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
  badge_emoji?: string | null;
  badge_label?: string | null;
  badge_color?: string | null;
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
  contact_phone: string | null;
  sold_at: string | null;
  views: number;
  accepted_buyer_id?: string | null;
  accepted_offer_price?: number | null;
  promoted_until?: string | null;
  created_at: string;
  updated_at: string;
};

export type DbListingImage = {
  id: string;
  listing_id: string;
  url: string;
  sort_order: number;
};

export function userPresence(lastActiveAt?: string | null) {
  if (!lastActiveAt) return { lastActiveAt: null as string | null, isOnline: false };
  const isOnline = Date.now() - new Date(lastActiveAt).getTime() < 120_000;
  return { lastActiveAt, isOnline };
}

export function formatUser(u: DbUser) {
  const presence = userPresence((u as DbUser & { last_active_at?: string }).last_active_at);
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
    badge:
      u.badge_emoji && u.badge_label
        ? { emoji: u.badge_emoji, label: u.badge_label, color: u.badge_color ?? "#2E90FA" }
        : null,
    role: (u as DbUser & { role?: string }).role ?? "user",
    createdAt: u.created_at,
    ...presence,
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
  const user = created as DbUser;

  void notifyAdmins({
    type: "admin_new_user",
    title: "Yeni Üye Kaydı",
    subtitle: user.name,
    body: `${user.name} platforma katıldı${user.email ? ` · ${user.email}` : ""}`,
    data: { userId: user.id, screen: "user" },
  }).catch(() => {});

  return user;
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

export async function getFavoriteCountsMap(listingIds: string[]): Promise<Map<string, number>> {
  const map = new Map(listingIds.map((id) => [id, 0]));
  if (!listingIds.length) return map;

  const sb = getSupabaseAdmin();
  const { data } = await sb.from("favorites").select("listing_id").in("listing_id", listingIds);

  for (const row of data ?? []) {
    map.set(row.listing_id, (map.get(row.listing_id) ?? 0) + 1);
  }
  return map;
}

export async function formatListingSummary(
  listing: DbListing,
  seller: DbUser,
  image: string,
  isFavorite: boolean,
  userLat?: number | null,
  userLon?: number | null,
  favoriteCount = 0,
  viewerUserId?: string | null,
) {
  const isOwner = Boolean(viewerUserId && viewerUserId === seller.id);
  const promotedUntil = listing.promoted_until ?? null;
  const isPromoted = promotedUntil ? new Date(promotedUntil).getTime() > Date.now() : false;
  return {
    id: listing.id,
    title: listing.title,
    price: listing.price,
    category: listing.category,
    status: listing.status,
    city: listing.city,
    district: listing.district,
    location: listing.location,
    isPromoted,
    promotedUntil: isPromoted ? promotedUntil : null,
    ...(isOwner ? { views: listing.views } : {}),
    favoriteCount,
    isFavorite,
    distance: calcDistance(userLat, userLon, listing.latitude, listing.longitude),
    image,
    createdAt: listing.created_at,
    seller: {
      id: seller.id,
      name: seller.name,
      avatar: seller.avatar,
      isVerified: seller.is_verified,
      badge:
        seller.badge_emoji && seller.badge_label
          ? { emoji: seller.badge_emoji, label: seller.badge_label, color: seller.badge_color ?? "#2E90FA" }
          : null,
    },
  };
}
