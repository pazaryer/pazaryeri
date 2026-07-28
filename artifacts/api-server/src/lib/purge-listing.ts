import { getSupabaseAdmin } from "./supabase-db";

/** İlanı ve tüm bağlı verileri sunucudan tamamen siler */
export async function purgeListingCompletely(listingId: string): Promise<void> {
  const sb = getSupabaseAdmin();

  await sb.from("offers").delete().eq("listing_id", listingId);
  await sb.from("favorites").delete().eq("listing_id", listingId);
  await sb.from("listing_views").delete().eq("listing_id", listingId);
  await sb.from("listing_images").delete().eq("listing_id", listingId);
  await sb.from("conversations").delete().eq("listing_id", listingId);
  await sb.from("reports").delete().eq("listing_id", listingId);

  const { error } = await sb.from("listings").delete().eq("id", listingId);
  if (error) throw new Error(error.message);
}
