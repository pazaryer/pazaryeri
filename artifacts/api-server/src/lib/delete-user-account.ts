import { getSupabaseAdmin } from "./supabase-db";
import { purgeListingCompletely } from "./purge-listing";

/** Kullanıcı hesabını ve tüm ilişkili verileri kalıcı siler (GDPR / Play Store uyumu) */
export async function deleteUserAccountCompletely(userId: string): Promise<void> {
  const sb = getSupabaseAdmin();

  const { data: listings } = await sb.from("listings").select("id").eq("seller_id", userId);
  for (const row of listings ?? []) {
    await purgeListingCompletely(row.id as string);
  }

  await sb.from("offers").delete().or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  await sb.from("conversations").delete().or(`buyer_id.eq.${userId},seller_id.eq.${userId}`);
  await sb.from("listing_comments").delete().eq("user_id", userId);
  await sb.from("reviews").delete().or(`reviewer_id.eq.${userId},reviewee_id.eq.${userId}`);
  await sb.from("favorites").delete().eq("user_id", userId);
  await sb.from("notifications").delete().eq("user_id", userId);
  await sb.from("device_presence").delete().eq("user_id", userId);
  await sb.from("reports").delete().eq("reporter_id", userId);

  const { error } = await sb.from("users").delete().eq("id", userId);
  if (error) throw new Error(error.message);
}
