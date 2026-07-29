import { getSupabaseAdmin } from "./supabase-db";
import { logger } from "./logger";

function parseNotificationIsRead(value: unknown): boolean {
  return value === true || value === "true";
}

async function getUnreadCount(userId: string): Promise<number> {
  const { data } = await getSupabaseAdmin()
    .from("notifications")
    .select("is_read")
    .eq("user_id", userId);

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
  options?: { type?: string; badge?: number },
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
    const channelId = notifType === "engagement" ? "engagement" : "default";
    const badge = options?.badge ?? (await getUnreadCount(userId));

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        data: data ?? {},
        sound: "default",
        priority: "high",
        channelId,
        badge,
      }),
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
