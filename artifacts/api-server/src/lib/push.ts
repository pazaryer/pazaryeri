import { getSupabaseAdmin } from "./supabase-db";
import { logger } from "./logger";
import { getPushSoundForType } from "./push-sounds";
import { parseNotificationIsRead } from "./notification-read";

async function getUnreadCount(userId: string): Promise<number> {
  const sb = getSupabaseAdmin();
  const { count, error } = await sb
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (!error && count != null) return count;

  const { data } = await sb.from("notifications").select("is_read").eq("user_id", userId).limit(500);
  return (data ?? []).filter((n) => !parseNotificationIsRead(n.is_read)).length;
}

export async function clearPushToken(userId: string): Promise<void> {
  await getSupabaseAdmin()
    .from("users")
    .update({ push_token: null, updated_at: new Date().toISOString() })
    .eq("id", userId);
}

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
  options?: { type?: string; badge?: number; subtitle?: string },
): Promise<void> {
  try {
    const { data: user } = await getSupabaseAdmin()
      .from("users")
      .select("push_token")
      .eq("id", userId)
      .single();

    const token = user?.push_token;
    if (!token || typeof token !== "string") return;

    const notifType = options?.type ?? data?.type ?? "default";
    const channelId =
      notifType === "engagement"
        ? "engagement"
        : notifType === "message"
          ? "messages"
          : notifType === "favorite" || notifType === "favorite_update"
            ? "favorites"
            : "default";
    const badge = options?.badge ?? (await getUnreadCount(userId));
    const sound = getPushSoundForType(notifType);

    const payload: Record<string, unknown> = {
      to: token,
      title,
      body,
      data: data ?? {},
      sound,
      priority: "high",
      channelId,
      badge,
    };
    if (options?.subtitle) payload.subtitle = options.subtitle;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      logger.warn({ status: response.status, userId }, "Push HTTP failed");
      return;
    }

    const result = (await response.json()) as {
      data?: Array<{ status: string; message?: string; details?: { error?: string } }>;
    };

    const ticket = result.data?.[0];
    if (ticket?.status === "error") {
      const errCode = ticket.details?.error;
      logger.warn({ errCode, message: ticket.message, userId }, "Push ticket error");
      if (errCode === "DeviceNotRegistered" || errCode === "InvalidCredentials") {
        await clearPushToken(userId);
      }
    }
  } catch (err) {
    logger.warn({ err, userId }, "Push error");
  }
}
