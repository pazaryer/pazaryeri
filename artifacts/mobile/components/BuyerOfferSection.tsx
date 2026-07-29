import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import {
  formatPrice,
  useMyListingOffer,
  useCreateOffer,
  useCounterOffer,
  useAcceptOffer,
} from '@/lib/hooks';
import { OfferModal } from './OfferModal';

interface BuyerOfferSectionProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  acceptsOffers: boolean;
  userId?: string;
}

export function BuyerOfferSection({
  listingId,
  listingTitle,
  listingPrice,
  acceptsOffers,
  userId,
}: BuyerOfferSectionProps) {
  const colors = useColors();
  const { data } = useMyListingOffer(listingId, !!userId);
  const createOffer = useCreateOffer();
  const counterOffer = useCounterOffer();
  const acceptOffer = useAcceptOffer();
  const [offerOpen, setOfferOpen] = useState(false);

  if (!userId || !acceptsOffers) return null;

  const offer = data?.offer;
  const canCounter = offer && (offer.status === 'pending' || offer.status === 'countered') && offer.offeredBy !== userId;
  const canAccept = offer && (offer.status === 'pending' || offer.status === 'countered') && offer.offeredBy !== userId;

  const handleCreate = async (amount: number, message?: string) => {
    await createOffer.mutateAsync({ listingId, amount, message });
    Alert.alert('Başarılı', 'Teklifiniz gönderildi');
  };

  const handleCounter = async (amount: number, message?: string) => {
    if (!offer) return;
    await counterOffer.mutateAsync({ offerId: offer.id, amount, message });
    Alert.alert('Başarılı', 'Karşı teklif gönderildi');
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.foreground }]}>Teklif</Text>

      {offer ? (
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.amount, { color: colors.primary }]}>{formatPrice(offer.amount)}</Text>
          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {offer.status === 'accepted'
              ? '✓ Kabul edildi — size özel fiyat uygulandı'
              : offer.status === 'pending'
                ? 'Teklifiniz bekliyor'
                : offer.status === 'countered'
                  ? offer.offeredBy === userId
                    ? 'Karşı teklifiniz bekliyor'
                    : 'Size karşı teklif geldi'
                  : offer.status}
          </Text>
          {offer.message ? (
            <Text style={[styles.message, { color: colors.mutedForeground }]}>{offer.message}</Text>
          ) : null}
          <View style={styles.actions}>
            {canAccept && (
              <Pressable
                style={[styles.btn, { backgroundColor: colors.primary }]}
                onPress={() =>
                  acceptOffer.mutateAsync({ offerId: offer.id }).then(() =>
                    Alert.alert('Başarılı', 'Teklif kabul edildi'),
                  )
                }
              >
                <Text style={styles.btnText}>Kabul Et</Text>
              </Pressable>
            )}
            {canCounter && (
              <Pressable
                style={[styles.btn, { borderColor: colors.primary, borderWidth: 1 }]}
                onPress={() => setOfferOpen(true)}
              >
                <Text style={[styles.btnText, { color: colors.primary }]}>Karşı Teklif</Text>
              </Pressable>
            )}
          </View>
        </View>
      ) : (
        <Pressable
          style={[styles.offerBtn, { backgroundColor: colors.secondary, borderColor: colors.primary }]}
          onPress={() => setOfferOpen(true)}
        >
          <Text style={[styles.offerBtnText, { color: colors.primary }]}>Teklif Ver</Text>
        </Pressable>
      )}

      <OfferModal
        visible={offerOpen}
        listingTitle={listingTitle}
        listingPrice={listingPrice}
        title={offer && canCounter ? 'Karşı Teklif Ver' : 'Teklif Ver'}
        onClose={() => setOfferOpen(false)}
        onSubmit={offer && canCounter ? handleCounter : handleCreate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16, gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  amount: { fontSize: 22, fontWeight: '800' },
  status: { fontSize: 13, fontWeight: '600' },
  message: { fontSize: 13, lineHeight: 18 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  offerBtn: { paddingVertical: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  offerBtnText: { fontSize: 15, fontWeight: '700' },
});
