import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "../middleware/errorHandler";

export async function isBlockedPair(
  sb: SupabaseClient,
  userA: string,
  userB: string,
): Promise<boolean> {
  const { data } = await sb
    .from("blocks")
    .select("id")
    .or(
      `and(blocker_id.eq.${userA},blocked_id.eq.${userB}),and(blocker_id.eq.${userB},blocked_id.eq.${userA})`,
    )
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function assertNotBlocked(
  sb: SupabaseClient,
  userA: string,
  userB: string,
): Promise<void> {
  if (await isBlockedPair(sb, userA, userB)) {
    throw new AppError("Bu kullanıcıyla iletişim kuramazsınız", 403);
  }
}
