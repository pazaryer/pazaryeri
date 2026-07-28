import { getSupabaseAdmin } from "./supabase-db";
import { pgIncrementViews, isPostgresConfigured, getPgPool } from "./postgres-db";

export async function trackUniqueListingView(listingId: string, deviceId?: string | null) {
  const id = deviceId?.trim();
  if (!id) return;

  if (isPostgresConfigured()) {
    const db = getPgPool();
    const inserted = await db.query(
      `INSERT INTO listing_views (listing_id, device_id)
       VALUES ($1, $2)
       ON CONFLICT (listing_id, device_id) DO NOTHING
       RETURNING id`,
      [listingId, id],
    );
    if (inserted.rowCount && inserted.rowCount > 0) {
      await pgIncrementViews(listingId);
    }
    return;
  }

  const sb = getSupabaseAdmin();
  const { data, error } = await sb
    .from("listing_views")
    .insert({ listing_id: listingId, device_id: id })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505" || error.message?.includes("duplicate")) return;
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
