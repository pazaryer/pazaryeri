import { getSupabaseAdmin } from "./supabase-db";
import { sendPushNotification } from "./push";

export async function notifyUser(params: {
  userId: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  await getSupabaseAdmin().from("notifications").insert({
    user_id: params.userId,
    type: params.type,
    title: params.title,
    body: params.body,
    data: JSON.stringify(params.data ?? {}),
  });
  await sendPushNotification(params.userId, params.title, params.body, params.data);
}
