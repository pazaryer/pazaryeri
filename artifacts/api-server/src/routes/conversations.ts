import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { getSupabaseAdmin, ensureUser, getListingImages, userPresence } from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { refreshConversationPreview } from "../lib/conversation-utils";
import { notifyNewMessage } from "../lib/conversation-notify";

const router: IRouter = Router();

router.get("/conversations", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const userId = req.user!.id;
    const { data: convos, error } = await sb
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (error) {
      throw new AppError(error.message, 500);
    }

    if (!convos?.length) {
      res.json({ items: [] });
      return;
    }

    const items = await Promise.all(
      convos.map(async (convo) => {
        const otherUserId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id;
        const [{ data: otherUser }, { data: listing }] = await Promise.all([
          sb.from("users").select("id, name, avatar, last_active_at").eq("id", otherUserId).maybeSingle(),
          sb.from("listings").select("title").eq("id", convo.listing_id).maybeSingle(),
        ]);
        let listingImage: string | null = null;
        try {
          const imageMap = await getListingImages([convo.listing_id]);
          listingImage = imageMap.get(convo.listing_id)?.[0] ?? null;
        } catch {
          listingImage = null;
        }
        const { count } = await sb
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("conversation_id", convo.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        const presence = userPresence(otherUser?.last_active_at);
        return {
          id: convo.id,
          listingId: convo.listing_id,
          listingTitle: listing?.title ?? "İlan",
          listingImage,
          otherUser: {
            id: otherUser?.id ?? otherUserId,
            name: otherUser?.name ?? "Kullanıcı",
            avatar: otherUser?.avatar ?? null,
            ...presence,
          },
          lastMessage: convo.last_message,
          lastMessageAt: convo.last_message_at,
          unreadCount: count ?? 0,
        };
      }),
    );

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post("/conversations", authMiddleware, async (req, res, next) => {
  try {
    const body = z.object({ listingId: z.string().uuid(), message: z.string().optional() }).parse(req.body);
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: listing } = await sb.from("listings").select("*").eq("id", body.listingId).single();
    if (!listing) throw new AppError("İlan bulunamadı", 404);
    if (listing.seller_id === userId) throw new AppError("Kendi ilanınıza mesaj gönderemezsiniz", 400);

    await ensureUser(userId);

    let { data: convo } = await sb
      .from("conversations")
      .select("*")
      .eq("listing_id", body.listingId)
      .eq("buyer_id", userId)
      .maybeSingle();

    if (!convo) {
      const { data: created, error } = await sb
        .from("conversations")
        .insert({ listing_id: body.listingId, buyer_id: userId, seller_id: listing.seller_id })
        .select()
        .single();
      if (error) throw new Error(error.message);
      convo = created;
    }

    if (body.message && convo) {
      const { data: msg } = await sb
        .from("messages")
        .insert({ conversation_id: convo.id, sender_id: userId, content: body.message })
        .select()
        .single();

      await sb.from("conversations").update({
        last_message: body.message,
        last_message_at: msg?.created_at,
        updated_at: new Date().toISOString(),
      }).eq("id", convo.id);

      await notifyNewMessage(sb, {
        recipientId: listing.seller_id,
        senderId: userId,
        conversationId: convo.id,
        listingId: body.listingId,
        content: body.message,
      });
    }

    const { data: seller } = await sb.from("users").select("id, name, avatar").eq("id", listing.seller_id).single();
    const imageMap = await getListingImages([listing.id]);

    res.json({
      id: convo!.id,
      listingId: convo!.listing_id,
      listingTitle: listing.title,
      listingImage: imageMap.get(listing.id)?.[0] ?? null,
      otherUser: { id: seller?.id, name: seller?.name ?? "Satıcı", avatar: seller?.avatar },
      lastMessage: convo!.last_message,
      lastMessageAt: convo!.last_message_at,
      unreadCount: 0,
    });
  } catch (err) {
    next(err);
  }
});

router.get("/conversations/:conversationId/messages", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const userId = req.user!.id;
    const limit = Math.min(Number(req.query.limit) || 50, 100);

    const { data: convo } = await sb.from("conversations").select("*").eq("id", req.params.conversationId).single();
    if (!convo) throw new AppError("Sohbet bulunamadı", 404);
    if (convo.buyer_id !== userId && convo.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    const otherUserId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id;
    const { data: otherUser } = await sb
      .from("users")
      .select("id, name, avatar, last_active_at")
      .eq("id", otherUserId)
      .maybeSingle();
    const { data: listing } = await sb.from("listings").select("title").eq("id", convo.listing_id).maybeSingle();

    const { data: messages } = await sb
      .from("messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true })
      .limit(limit);

    const now = new Date().toISOString();
    await sb
      .from("messages")
      .update({ delivered_at: now })
      .eq("conversation_id", convo.id)
      .neq("sender_id", userId)
      .is("delivered_at", null);
    await sb
      .from("messages")
      .update({ is_read: true })
      .eq("conversation_id", convo.id)
      .neq("sender_id", userId);

    const presence = userPresence(otherUser?.last_active_at);

    res.json({
      conversation: {
        id: convo.id,
        listingId: convo.listing_id,
        listingTitle: listing?.title ?? "İlan",
        otherUser: {
          id: otherUser?.id ?? otherUserId,
          name: otherUser?.name ?? "Kullanıcı",
          avatar: otherUser?.avatar ?? null,
          ...presence,
        },
      },
      items: (messages ?? []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        isRead: m.is_read,
        deliveredAt: m.delivered_at ?? null,
        createdAt: m.created_at,
      })),
      hasMore: false,
      nextCursor: null,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/conversations/:conversationId/messages", authMiddleware, async (req, res, next) => {
  try {
    const { content } = z.object({ content: z.string().min(1).max(2000) }).parse(req.body);
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: convo } = await sb.from("conversations").select("*").eq("id", req.params.conversationId).single();
    if (!convo) throw new AppError("Sohbet bulunamadı", 404);
    if (convo.buyer_id !== userId && convo.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    const { data: msg, error } = await sb
      .from("messages")
      .insert({ conversation_id: convo.id, sender_id: userId, content })
      .select()
      .single();
    if (error || !msg) throw new Error(error?.message);

    await sb.from("conversations").update({
      last_message: content,
      last_message_at: msg.created_at,
      updated_at: new Date().toISOString(),
    }).eq("id", convo.id);

    const recipientId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id;
    await notifyNewMessage(sb, {
      recipientId,
      senderId: userId,
      conversationId: convo.id,
      listingId: convo.listing_id,
      content,
    });

    res.status(201).json({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      isRead: msg.is_read,
      deliveredAt: msg.delivered_at ?? null,
      createdAt: msg.created_at,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/conversations/:conversationId", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();
    const { data: convo } = await sb.from("conversations").select("*").eq("id", req.params.conversationId).single();
    if (!convo) throw new AppError("Sohbet bulunamadı", 404);
    if (convo.buyer_id !== userId && convo.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    await sb.from("messages").delete().eq("conversation_id", convo.id);
    await sb.from("conversations").delete().eq("id", convo.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.delete("/messages/:messageId", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();
    const { data: msg } = await sb.from("messages").select("*").eq("id", req.params.messageId).single();
    if (!msg) throw new AppError("Mesaj bulunamadı", 404);
    if (msg.sender_id !== userId) throw new AppError("Sadece kendi mesajınızı silebilirsiniz", 403);

    const { data: convo } = await sb.from("conversations").select("*").eq("id", msg.conversation_id).single();
    if (!convo) throw new AppError("Sohbet bulunamadı", 404);
    if (convo.buyer_id !== userId && convo.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    await sb.from("messages").delete().eq("id", msg.id);
    await refreshConversationPreview(msg.conversation_id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
