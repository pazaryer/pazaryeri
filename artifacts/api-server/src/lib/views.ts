import { getSupabaseAdmin } from "./supabase-db";
import { pgIncrementViews, isPostgresConfigured, getPgPool } from "./postgres-db";

export async function trackUniqueListingView(
  listingId: string,
  deviceId?: string | null,
  userId?: string | null,
) {
  const id = deviceId?.trim();
  if (!id) return;

  const viewerId = userId?.trim() || null;

  if (isPostgresConfigured()) {
    const db = getPgPool();
    const result = await db.query<{ inserted: boolean }>(
      `INSERT INTO listing_views (listing_id, device_id, user_id, last_viewed_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (listing_id, device_id) DO UPDATE SET
         user_id = COALESCE(EXCLUDED.user_id, listing_views.user_id),
         last_viewed_at = NOW()
       RETURNING (xmax = 0) AS inserted`,
      [listingId, id, viewerId],
    );
    if (result.rows[0]?.inserted) {
      await pgIncrementViews(listingId);
    }
    return;
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("listing_views")
    .insert({ listing_id: listingId, device_id: id, user_id: viewerId })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate")) {
      if (viewerId) {
        await sb
          .from("listing_views")
          .update({ user_id: viewerId, last_viewed_at: new Date().toISOString() })
          .eq("listing_id", listingId)
          .eq("device_id", id)
          .is("user_id", null);
      }
      return;
    }
    if (error.code === "42P01") {
      await sb
        .from("listings")
        .select("views")
        .eq("id", listingId)
        .single()
        .then(({ data: row }) => {
          if (row) return sb.from("listings").update({ views: row.views + 1 }).eq("id", listingId);
        });
      return;
    }
    return;
  }

  if (data) {
    const { data: row } = await sb.from("listings").select("views").eq("id", listingId).single();
    if (row) {
      await sb.from("listings").update({ views: row.views + 1 }).eq("id", listingId);
    }
  }
}
