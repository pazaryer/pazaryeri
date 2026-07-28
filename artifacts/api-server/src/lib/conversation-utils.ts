import { getSupabaseAdmin } from "./supabase-db";

/** Sohbetin son mesaj özetini günceller */
export async function refreshConversationPreview(conversationId: string): Promise<void> {
  const sb = getSupabaseAdmin();
  const { data: last } = await sb
    .from("messages")
    .select("content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  await sb
    .from("conversations")
    .update({
      last_message: last?.content ?? null,
      last_message_at: last?.created_at ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);
}
