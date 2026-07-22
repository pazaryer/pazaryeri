import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { getSupabaseAdmin, ensureUser, getListingImages } from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { sendPushNotification } from "../lib/push";

const router: IRouter = Router();

router.get("/conversations", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const userId = req.user!.id;
    const { data: convos } = await sb
      .from("conversations")
      .select("*")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("last_message_at", { ascending: false });

    const items = await Promise.all(
      (convos ?? []).map(async (convo) => {
        const otherUserId = convo.buyer_id === userId ? convo.seller_id : convo.buyer_id;
        const [{ data: otherUser }, { data: listing }] = await Promise.all([
          sb.from("users").select("id, name, avatar").eq("id", otherUserId).single(),
          sb.from("listings").select("title").eq("id", convo.listing_id).single(),
        ]);
        const imageMap = await getListingImages([convo.listing_id]);
        const { count } = await sb
          .from("messages")
          .select("*", { count: "exact", head: true })
          .eq("conversation_id", convo.id)
          .eq("is_read", false)
          .neq("sender_id", userId);

        return {
          id: convo.id,
          listingId: convo.listing_id,
          listingTitle: listing?.title ?? "İlan",
          listingImage: imageMap.get(convo.listing_id)?.[0] ?? null,
          otherUser: { id: otherUser?.id ?? otherUserId, name: otherUser?.name ?? "Kullanıcı", avatar: otherUser?.avatar ?? null },
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

      await sb.from("notifications").insert({
        user_id: listing.seller_id,
        type: "message",
        title: "Yeni Mesaj",
        body: body.message.slice(0, 100),
        data: JSON.stringify({ conversationId: convo.id }),
      });

      sendPushNotification(listing.seller_id, "Yeni Mesaj", body.message.slice(0, 100));
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

    const { data: messages } = await sb
      .from("messages")
      .select("*")
      .eq("conversation_id", convo.id)
      .order("created_at", { ascending: true })
      .limit(limit);

    await sb.from("messages").update({ is_read: true }).eq("conversation_id", convo.id).neq("sender_id", userId);

    res.json({
      items: (messages ?? []).map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderId: m.sender_id,
        content: m.content,
        isRead: m.is_read,
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
    await sb.from("notifications").insert({
      user_id: recipientId,
      type: "message",
      title: "Yeni Mesaj",
      body: content.slice(0, 100),
      data: JSON.stringify({ conversationId: convo.id }),
    });
    sendPushNotification(recipientId, "Yeni Mesaj", content.slice(0, 100));

    res.status(201).json({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      content: msg.content,
      isRead: msg.is_read,
      createdAt: msg.created_at,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
