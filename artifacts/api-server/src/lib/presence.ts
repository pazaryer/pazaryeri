import { getSupabaseAdmin } from "./supabase-db";

export async function upsertDevicePresence(
  deviceId: string,
  opts?: { userId?: string; platform?: string; appVersion?: string },
): Promise<void> {
  const id = deviceId.trim();
  if (!id || id.length < 8) return;

  const sb = getSupabaseAdmin();
  const now = new Date().toISOString();
  const { error } = await sb.from("device_presence").upsert(
    {
      device_id: id,
      user_id: opts?.userId ?? null,
      platform: opts?.platform ?? null,
      app_version: opts?.appVersion ?? null,
      last_ping_at: now,
    },
    { onConflict: "device_id" },
  );
  if (error && !error.message.includes("does not exist")) {
    // migration henüz uygulanmamışsa sessizce geç
  }
}

export type LiveAnalytics = {
  users: {
    live: number;
    last24h: number;
    newToday: number;
    liveDevices: { deviceId: string; userId: string | null; platform: string | null; lastPingAt: string }[];
  };
  listings: {
    live: number;
    last24h: number;
    newToday: number;
  };
  marquee: { enabled: boolean };
};

function startOfTodayIso(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function getLiveAnalytics(): Promise<LiveAnalytics> {
  const sb = getSupabaseAdmin();
  const now = Date.now();
  const liveCutoff = new Date(now - 5 * 60 * 1000).toISOString();
  const dayCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const todayStart = startOfTodayIso();

  const [
    usersTotal,
    usersNewToday,
    listingsTotal,
    listingsActive,
    listingsNewToday,
    usersLiveRes,
    users24Res,
    listingsLiveRes,
    listings24Res,
    marqueeRes,
  ] = await Promise.all([
    sb.from("users").select("id", { count: "exact", head: true }),
    sb.from("users").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
    sb.from("listings").select("id", { count: "exact", head: true }).neq("status", "deleted"),
    sb.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
    sb.from("listings").select("id", { count: "exact", head: true }).gte("created_at", todayStart).neq("status", "deleted"),
    sb.from("device_presence").select("device_id, user_id, platform, last_ping_at").gte("last_ping_at", liveCutoff).order("last_ping_at", { ascending: false }).limit(100),
    sb.from("device_presence").select("device_id", { count: "exact", head: true }).gte("last_ping_at", dayCutoff),
    sb.from("listing_views").select("listing_id").gte("last_viewed_at", liveCutoff),
    sb.from("listing_views").select("listing_id").gte("last_viewed_at", dayCutoff),
    sb.from("marquee_items").select("id", { count: "exact", head: true }).eq("enabled", true),
  ]);

  const liveDevices = (usersLiveRes.data ?? []).map((r) => ({
    deviceId: r.device_id as string,
    userId: (r.user_id as string | null) ?? null,
    platform: (r.platform as string | null) ?? null,
    lastPingAt: r.last_ping_at as string,
  }));

  const liveListingIds = new Set((listingsLiveRes.data ?? []).map((r) => r.listing_id as string));
  const dayListingIds = new Set((listings24Res.data ?? []).map((r) => r.listing_id as string));

  return {
    users: {
      live: liveDevices.length,
      last24h: users24Res.count ?? 0,
      newToday: usersNewToday.count ?? 0,
      liveDevices,
    },
    listings: {
      live: liveListingIds.size,
      last24h: dayListingIds.size,
      newToday: listingsNewToday.count ?? 0,
    },
    marquee: { enabled: (marqueeRes.count ?? 0) > 0 },
  };
}
