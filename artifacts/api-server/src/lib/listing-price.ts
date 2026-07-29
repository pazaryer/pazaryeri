import type { DbListing } from "./supabase-db";

export function resolveListingPriceForViewer(
  listing: DbListing & {
    accepted_buyer_id?: string | null;
    accepted_offer_price?: number | null;
  },
  viewerUserId?: string | null,
): { price: number; originalPrice?: number; hasNegotiatedPrice: boolean } {
  const basePrice = listing.price;
  if (
    viewerUserId &&
    listing.accepted_buyer_id === viewerUserId &&
    listing.accepted_offer_price != null
  ) {
    return {
      price: listing.accepted_offer_price,
      originalPrice: basePrice,
      hasNegotiatedPrice: true,
    };
  }
  return { price: basePrice, hasNegotiatedPrice: false };
}
