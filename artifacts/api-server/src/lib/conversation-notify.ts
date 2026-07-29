import { getSupabaseAdmin, getListingImages } from "./supabase-db";
import { notifyUser } from "./notify";

type SupabaseAdmin = ReturnType<typeof getSupabaseAdmin>;

export async function notifyNewMessage(
  sb: SupabaseAdmin,
  params: {
    recipientId: string;
    senderId: string;
    conversationId: string;
    listingId: string;
    content: string;
  },
): Promise<void> {
  const [{ data: sender }, { data: listing }] = await Promise.all([
    sb.from("users").select("name, avatar").eq("id", params.senderId).maybeSingle(),
    sb.from("listings").select("title").eq("id", params.listingId).maybeSingle(),
  ]);

  const senderName = sender?.name ?? "Kullanıcı";
  const listingTitle = listing?.title ?? "İlan";
  const preview = params.content.slice(0, 120);

  let listingImage: string | null = null;
  try {
    const imageMap = await getListingImages([params.listingId]);
    listingImage = imageMap.get(params.listingId)?.[0] ?? null;
  } catch {
    listingImage = null;
  }

  await notifyUser({
    userId: params.recipientId,
    type: "message",
    title: senderName,
    subtitle: listingTitle,
    body: preview,
    data: {
      conversationId: params.conversationId,
      listingId: params.listingId,
      senderName,
      listingTitle,
      messageText: preview,
      senderAvatar: sender?.avatar ?? "",
      listingImage: listingImage ?? "",
    },
  });
}
