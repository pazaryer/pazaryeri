import { getSupabaseAdmin } from "./supabase-db";
import { logger } from "./logger";

export async function sendPushNotification(
  userId: string,
  title: string,
  body: string,
  data?: Record<string, string>,
): Promise<void> {
  try {
    const { data: user } = await getSupabaseAdmin()
      .from("users")
      .select("push_token")
      .eq("id", userId)
      .single();

    if (!user?.push_token) return;

    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ to: user.push_token, title, body, data }),
    });

    if (!response.ok) logger.warn({ status: response.status }, "Push failed");
  } catch (err) {
    logger.warn({ err }, "Push error");
  }
}
