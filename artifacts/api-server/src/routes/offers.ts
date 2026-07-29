import { Router, type IRouter } from "express";
import { z } from "zod/v4";
import { getSupabaseAdmin, ensureUser } from "../lib/supabase-db";
import { authMiddleware } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { notifyUser } from "../lib/notify";
import { assertNotBlocked } from "../lib/blocks";

const router: IRouter = Router();

const createOfferSchema = z.object({
  listingId: z.string().uuid(),
  amount: z.number().int().min(1),
  message: z.string().max(500).optional(),
});

const counterSchema = z.object({
  amount: z.number().int().min(1),
  message: z.string().max(500).optional(),
});

function formatOffer(row: Record<string, unknown>, buyer?: { id: string; name: string; avatar?: string | null }, seller?: { id: string; name: string; avatar?: string | null }) {
  return {
    id: row.id,
    listingId: row.listing_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    amount: row.amount,
    offeredBy: row.offered_by,
    status: row.status,
    message: row.message,
    parentOfferId: row.parent_offer_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    buyer: buyer ? { id: buyer.id, name: buyer.name, avatar: buyer.avatar ?? null } : undefined,
    seller: seller ? { id: seller.id, name: seller.name, avatar: seller.avatar ?? null } : undefined,
  };
}

async function loadUsers(sb: ReturnType<typeof getSupabaseAdmin>, buyerId: string, sellerId: string) {
  const [{ data: buyer }, { data: seller }] = await Promise.all([
    sb.from("users").select("id, name, avatar").eq("id", buyerId).single(),
    sb.from("users").select("id, name, avatar").eq("id", sellerId).single(),
  ]);
  return { buyer, seller };
}

router.get("/offers/listing/:listingId/mine", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const userId = req.user!.id;
    const listingId = req.params.listingId;

    const { data: offer } = await sb
      .from("offers")
      .select("*")
      .eq("listing_id", listingId)
      .eq("buyer_id", userId)
      .in("status", ["pending", "countered", "accepted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!offer) {
      res.json({ offer: null });
      return;
    }

    const users = await loadUsers(sb, offer.buyer_id, offer.seller_id);
    res.json({
      offer: formatOffer(offer, users.buyer ?? undefined, users.seller ?? undefined),
    });
  } catch (err) {
    next(err);
  }
});

router.get("/offers/listing/:listingId", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const userId = req.user!.id;
    const listingId = req.params.listingId;

    const { data: listing } = await sb.from("listings").select("seller_id, title").eq("id", listingId).single();
    if (!listing) throw new AppError("İlan bulunamadı", 404);
    if (listing.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    const { data: rows } = await sb
      .from("offers")
      .select("*")
      .eq("listing_id", listingId)
      .in("status", ["pending", "countered"])
      .order("created_at", { ascending: false });

    const items = await Promise.all(
      (rows ?? []).map(async (row) => {
        const users = await loadUsers(sb, row.buyer_id, row.seller_id);
        return formatOffer(row, users.buyer ?? undefined, users.seller ?? undefined);
      }),
    );

    res.json({ items, listingTitle: listing.title });
  } catch (err) {
    next(err);
  }
});

router.get("/offers/my", authMiddleware, async (req, res, next) => {
  try {
    const sb = getSupabaseAdmin();
    const userId = req.user!.id;

    const { data: rows } = await sb
      .from("offers")
      .select("*, listings(title)")
      .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
      .order("created_at", { ascending: false })
      .limit(50);

    const items = await Promise.all(
      (rows ?? []).map(async (row) => {
        const users = await loadUsers(sb, row.buyer_id, row.seller_id);
        return {
          ...formatOffer(row, users.buyer ?? undefined, users.seller ?? undefined),
          listingTitle: (row as { listings?: { title?: string } }).listings?.title ?? "İlan",
        };
      }),
    );

    res.json({ items });
  } catch (err) {
    next(err);
  }
});

router.post("/offers", authMiddleware, async (req, res, next) => {
  try {
    const body = createOfferSchema.parse(req.body);
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: listing } = await sb.from("listings").select("*").eq("id", body.listingId).single();
    if (!listing) throw new AppError("İlan bulunamadı", 404);
    if (listing.status !== "active") throw new AppError("Bu ilan teklif kabul etmiyor", 400);
    if (!listing.accepts_offers) throw new AppError("Satıcı teklif kabul etmiyor", 400);
    if (listing.seller_id === userId) throw new AppError("Kendi ilanınıza teklif veremezsiniz", 400);

    await ensureUser(userId);
    await assertNotBlocked(sb, userId, listing.seller_id);

    const { data: existing } = await sb
      .from("offers")
      .select("id")
      .eq("listing_id", body.listingId)
      .eq("buyer_id", userId)
      .in("status", ["pending", "countered"])
      .maybeSingle();

    if (existing) throw new AppError("Bu ilana zaten aktif teklifiniz var", 400);

    const { data: offer, error } = await sb
      .from("offers")
      .insert({
        listing_id: body.listingId,
        buyer_id: userId,
        seller_id: listing.seller_id,
        amount: body.amount,
        offered_by: userId,
        status: "pending",
        message: body.message ?? null,
      })
      .select()
      .single();

    if (error || !offer) throw new Error(error?.message ?? "Teklif oluşturulamadı");

    const price = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(body.amount);
    await notifyUser({
      userId: listing.seller_id,
      type: "offer",
      title: "Yeni Teklif",
      body: `${listing.title} için ${price} teklif geldi`,
      data: { listingId: body.listingId, offerId: offer.id },
    });

    const users = await loadUsers(sb, userId, listing.seller_id);
    res.status(201).json(formatOffer(offer, users.buyer ?? undefined, users.seller ?? undefined));
  } catch (err) {
    next(err);
  }
});

router.post("/offers/:offerId/counter", authMiddleware, async (req, res, next) => {
  try {
    const body = counterSchema.parse(req.body);
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: parent } = await sb.from("offers").select("*, listings(title)").eq("id", req.params.offerId).single();
    if (!parent) throw new AppError("Teklif bulunamadı", 404);
    if (!["pending", "countered"].includes(parent.status)) throw new AppError("Bu teklif artık aktif değil", 400);

    const isSeller = parent.seller_id === userId;
    const isBuyer = parent.buyer_id === userId;
    if (!isSeller && !isBuyer) throw new AppError("Yetkisiz", 403);
    if (parent.offered_by === userId) throw new AppError("Sıra karşı tarafta", 400);

    await assertNotBlocked(sb, parent.buyer_id, parent.seller_id);

    await sb.from("offers").update({ status: "superseded", updated_at: new Date().toISOString() }).eq("id", parent.id);

    const { data: offer, error } = await sb
      .from("offers")
      .insert({
        listing_id: parent.listing_id,
        buyer_id: parent.buyer_id,
        seller_id: parent.seller_id,
        amount: body.amount,
        offered_by: userId,
        status: "countered",
        message: body.message ?? null,
        parent_offer_id: parent.id,
      })
      .select()
      .single();

    if (error || !offer) throw new Error(error?.message ?? "Karşı teklif oluşturulamadı");

    const recipientId = isSeller ? parent.buyer_id : parent.seller_id;
    const listingTitle = (parent as { listings?: { title?: string } }).listings?.title ?? "İlan";
    const price = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(body.amount);

    await notifyUser({
      userId: recipientId,
      type: "offer",
      title: "Karşı Teklif",
      body: `${listingTitle} için ${price} karşı teklif`,
      data: { listingId: parent.listing_id, offerId: offer.id },
    });

    const users = await loadUsers(sb, parent.buyer_id, parent.seller_id);
    res.json(formatOffer(offer, users.buyer ?? undefined, users.seller ?? undefined));
  } catch (err) {
    next(err);
  }
});

router.post("/offers/:offerId/accept", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: offer } = await sb.from("offers").select("*, listings(title)").eq("id", req.params.offerId).single();
    if (!offer) throw new AppError("Teklif bulunamadı", 404);
    if (!["pending", "countered"].includes(offer.status)) throw new AppError("Teklif artık aktif değil", 400);
    if (offer.buyer_id !== userId && offer.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    await sb.from("offers").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", offer.id);

    await sb
      .from("listings")
      .update({
        accepted_buyer_id: offer.buyer_id,
        accepted_offer_price: offer.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", offer.listing_id);

    await sb
      .from("offers")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("listing_id", offer.listing_id)
      .neq("id", offer.id)
      .in("status", ["pending", "countered"]);

    const recipientId = offer.offered_by === offer.buyer_id ? offer.seller_id : offer.buyer_id;
    const listingTitle = (offer as { listings?: { title?: string } }).listings?.title ?? "İlan";
    const price = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(offer.amount);

    await notifyUser({
      userId: recipientId,
      type: "offer",
      title: "Teklif Kabul Edildi",
      body: `${listingTitle} — ${price} teklif kabul edildi`,
      data: { listingId: offer.listing_id, offerId: offer.id },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

router.post("/offers/:offerId/reject", authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const sb = getSupabaseAdmin();

    const { data: offer } = await sb.from("offers").select("*").eq("id", req.params.offerId).single();
    if (!offer) throw new AppError("Teklif bulunamadı", 404);
    if (!["pending", "countered"].includes(offer.status)) throw new AppError("Teklif artık aktif değil", 400);
    if (offer.buyer_id !== userId && offer.seller_id !== userId) throw new AppError("Yetkisiz", 403);

    await sb.from("offers").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", offer.id);

    const recipientId = offer.offered_by === offer.buyer_id ? offer.seller_id : offer.buyer_id;
    await notifyUser({
      userId: recipientId,
      type: "offer",
      title: "Teklif Reddedildi",
      body: "Teklifiniz reddedildi",
      data: { listingId: offer.listing_id, offerId: offer.id },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

export default router;
