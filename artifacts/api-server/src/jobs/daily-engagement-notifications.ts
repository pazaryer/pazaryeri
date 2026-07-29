import { getSupabaseAdmin } from "../lib/supabase-db";
import { notifyUser } from "../lib/notify";
import { logger } from "../lib/logger";

/** Türkiye saatiyle günde 3 kez: 10:00, 14:00, 19:00 */
const ENGAGEMENT_HOURS_TR = [10, 14, 19];
const CHECK_INTERVAL_MS = 15 * 60 * 1000;
const ACTIVE_SKIP_MS = 3 * 60 * 60 * 1000;

type EngagementMessage = {
  title: string;
  body: string;
  screen: string;
};

const MORNING_MESSAGES: EngagementMessage[] = [
  {
    title: "Günaydın! ☀️",
    body: "Yakınındaki yeni ilanlara göz at, fırsatları kaçırma.",
    screen: "explore",
  },
  {
    title: "Bugün ne arıyorsun?",
    body: "Pazaryeri'de yüzlerce ilan seni bekliyor.",
    screen: "home",
  },
  {
    title: "Sabah fırsatları 🛍️",
    body: "Yeni eklenen ilanları ilk sen keşfet.",
    screen: "explore",
  },
];

const MIDDAY_MESSAGES: EngagementMessage[] = [
  {
    title: "Öğle molası mı? ☕",
    body: "Kısa bir mola ver, yakınındaki ilanlara bak.",
    screen: "explore",
  },
  {
    title: "Popüler ilanlar 🔥",
    body: "Bugün en çok ilgi gören ürünleri keşfet.",
    screen: "home",
  },
  {
    title: "Pazarlık zamanı 💬",
    body: "Beğendiğin ilana hemen teklif ver.",
    screen: "explore",
  },
];

const EVENING_MESSAGES: EngagementMessage[] = [
  {
    title: "Akşam alışverişi 🌙",
    body: "Günün son fırsatlarını kaçırma, hemen göz at.",
    screen: "explore",
  },
  {
    title: "Pazaryeri seni özledi",
    body: "Yeni mesajların veya tekliflerin olabilir, kontrol et.",
    screen: "messages",
  },
  {
    title: "İlan ver, satışa başla 📦",
    body: "Kullanmadığın eşyaları dakikalar içinde ilana dönüştür.",
    screen: "post",
  },
];

function getTurkeyParts(): { dateKey: string; hour: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "numeric",
    hour12: false,
  }).formatToParts(new Date());

  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = Number(get("hour"));
  const dateKey = `${get("year")}-${get("month")}-${get("day")}`;

  return { dateKey, hour: Number.isFinite(hour) ? hour : -1 };
}

function pickMessage(hour: number, index: number): EngagementMessage {
  const pool =
    hour === 10 ? MORNING_MESSAGES : hour === 14 ? MIDDAY_MESSAGES : EVENING_MESSAGES;
  return pool[index % pool.length]!;
}

async function countNewListingsToday(): Promise<number> {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);

  const { count } = await getSupabaseAdmin()
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active")
    .gte("created_at", start.toISOString());

  return count ?? 0;
}

async function getTrendingListingTitle(): Promise<string | null> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data } = await getSupabaseAdmin()
    .from("listings")
    .select("title")
    .eq("status", "active")
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1);

  return data?.[0]?.title ?? null;
}

export async function sendEngagementNotifications(slotHour: number): Promise<number> {
  const sb = getSupabaseAdmin();
  const { dateKey } = getTurkeyParts();
  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);

  const { data: users, error } = await sb
    .from("users")
    .select("id, push_token, last_active_at")
    .not("push_token", "is", null);

  if (error) {
    logger.error({ err: error.message }, "engagement: user fetch failed");
    return 0;
  }

  const newListings = await countNewListingsToday();
  const trendingTitle = await getTrendingListingTitle();
  let sent = 0;
  let idx = 0;

  for (const user of users ?? []) {
    if (!user.push_token) continue;

    if (user.last_active_at) {
      const lastActive = new Date(user.last_active_at).getTime();
      if (Date.now() - lastActive < ACTIVE_SKIP_MS) continue;
    }

    const slotTag = `${dateKey}-${slotHour}`;

    const { data: alreadyToday } = await sb
      .from("notifications")
      .select("id, data")
      .eq("user_id", user.id)
      .eq("type", "engagement")
      .gte("created_at", todayStart.toISOString());

    const slotAlreadySent = (alreadyToday ?? []).some((row) => {
      if (!row.data || typeof row.data !== "string") return false;
      try {
        const parsed = JSON.parse(row.data) as { slot?: string };
        return parsed.slot === slotTag;
      } catch {
        return false;
      }
    });

    if (slotAlreadySent) continue;

    let msg = pickMessage(slotHour, idx);
    idx += 1;

    if (slotHour === 10 && newListings > 5) {
      msg = {
        title: `${newListings}+ yeni ilan 📍`,
        body: "Bugün yakınına eklenen ilanları hemen keşfet.",
        screen: "explore",
      };
    } else if (slotHour === 19 && trendingTitle) {
      msg = {
        title: "Günün ilanı 🔥",
        body: `"${trendingTitle.slice(0, 60)}" ve daha fazlası seni bekliyor.`,
        screen: "explore",
      };
    }

    try {
      await notifyUser({
        userId: user.id,
        type: "engagement",
        title: msg.title,
        body: msg.body,
        data: { screen: msg.screen, slot: slotTag },
      });
      sent += 1;
    } catch (err) {
      logger.warn({ err, userId: user.id }, "engagement: notify failed");
    }
  }

  if (sent > 0) {
    logger.info({ sent, slotHour, dateKey }, "Engagement notifications sent");
  }

  return sent;
}

let lastRunSlotKey: string | null = null;

export function startEngagementNotificationScheduler(): void {
  const tick = () => {
    const { dateKey, hour } = getTurkeyParts();
    if (!ENGAGEMENT_HOURS_TR.includes(hour)) return;

    const slotKey = `${dateKey}-${hour}`;
    if (lastRunSlotKey === slotKey) return;
    lastRunSlotKey = slotKey;

    sendEngagementNotifications(hour).catch((err) => {
      logger.error({ err }, "Scheduled engagement notifications error");
      lastRunSlotKey = null;
    });
  };

  setTimeout(tick, 90_000);
  setInterval(tick, CHECK_INTERVAL_MS);
  logger.info("Engagement notification scheduler started (10:00, 14:00, 19:00 TR)");
}
