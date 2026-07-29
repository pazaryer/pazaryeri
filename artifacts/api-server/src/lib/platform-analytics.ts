import { getSupabaseAdmin } from "./supabase-db";
import { getAnalyticsResetAt, effectiveSince } from "./analytics-reset";

export type PlatformSession = {
  deviceId: string;
  userId: string | null;
  userName: string | null;
  userEmail: string | null;
  platform: string | null;
  appVersion: string | null;
  lastPingAt: string;
  firstSeenAt: string;
  isLoggedIn: boolean;
};

export type PlatformAnalytics = {
  platform: "web" | "mobile";
  live: number;
  last24h: number;
  loggedInLive: number;
  guestLive: number;
  newToday: number;
  sessions: PlatformSession[];
  recentLogins: {
    id: string;
    name: string;
    email: string | null;
    lastActiveAt: string;
    deviceId: string;
  }[];
};

function platformFilter(group: "web" | "mobile") {
  return group === "web" ? ["web"] : ["ios", "android"];
}

export async function getPlatformAnalytics(group: "web" | "mobile"): Promise<PlatformAnalytics> {
  const sb = getSupabaseAdmin();
  const now = Date.now();
  const liveCutoff = new Date(now - 5 * 60 * 1000).toISOString();
  const dayCutoff = new Date(now - 24 * 60 * 60 * 1000).toISOString();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const resetAt = await getAnalyticsResetAt();
  const since24h = effectiveSince(resetAt, dayCutoff);
  const sinceToday = effectiveSince(resetAt, todayStart.toISOString());
  const platforms = platformFilter(group);

  const liveQuery = sb
    .from("device_presence")
    .select("device_id, user_id, platform, app_version, last_ping_at, first_seen_at, users(id, name, email)")
    .gte("last_ping_at", liveCutoff)
    .in("platform", platforms)
    .order("last_ping_at", { ascending: false })
    .limit(120);

  const dayQuery = sb
    .from("device_presence")
    .select("device_id", { count: "exact", head: true })
    .gte("last_ping_at", since24h)
    .in("platform", platforms);

  const newDevicesQuery = sb
    .from("device_presence")
    .select("device_id", { count: "exact", head: true })
    .gte("first_seen_at", sinceToday)
    .in("platform", platforms);

  const [{ data: liveRows }, { count: dayCount }, { count: newToday }] = await Promise.all([
    liveQuery,
    dayQuery,
    newDevicesQuery,
  ]);

  const sessions: PlatformSession[] = (liveRows ?? []).map((r) => {
    const u = r.users as { id?: string; name?: string; email?: string | null } | null;
    return {
      deviceId: r.device_id as string,
      userId: (r.user_id as string | null) ?? null,
      userName: u?.name ?? null,
      userEmail: u?.email ?? null,
      platform: (r.platform as string | null) ?? null,
      appVersion: (r.app_version as string | null) ?? null,
      lastPingAt: r.last_ping_at as string,
      firstSeenAt: r.first_seen_at as string,
      isLoggedIn: Boolean(r.user_id),
    };
  });

  const loggedInLive = sessions.filter((s) => s.isLoggedIn).length;
  const guestLive = sessions.length - loggedInLive;

  const recentLogins = sessions
    .filter((s) => s.isLoggedIn && s.userId)
    .slice(0, 25)
    .map((s) => ({
      id: s.userId!,
      name: s.userName ?? "Kullanıcı",
      email: s.userEmail,
      lastActiveAt: s.lastPingAt,
      deviceId: s.deviceId,
    }));

  return {
    platform: group,
    live: sessions.length,
    last24h: dayCount ?? 0,
    loggedInLive,
    guestLive,
    newToday: newToday ?? 0,
    sessions,
    recentLogins,
  };
}
