import { getSupabaseAdmin } from "./supabase-db";
import { sendPushNotification } from "./push";

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  skipPush?: boolean;
}) {
  const dataPayload = { ...(params.data ?? {}), type: params.type };
  const pushData = Object.fromEntries(
    Object.entries(dataPayload).map(([key, value]) => [key, String(value)]),
  );

  await getSupabaseAdmin().from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: JSON.stringify(dataPayload),
    is_read: false,
  });

  if (!params.skipPush) {
    await sendPushNotification(params.userId, params.title, params.body, pushData, {
      type: params.type,
    });
  }
}
