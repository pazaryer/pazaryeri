import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useColors } from '@/hooks/useColors';
import {
  formatPrice,
  useListingOffers,
  useAcceptOffer,
  useRejectOffer,
  useCounterOffer,
  type OfferSummary,
} from '@/lib/hooks';
import { OfferModal } from './OfferModal';

interface ListingOffersSectionProps {
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  isOwner: boolean;
  currentUserId?: string;
}

export function ListingOffersSection({
  listingId,
  listingTitle,
  listingPrice,
  isOwner,
  currentUserId,
}: ListingOffersSectionProps) {
  const colors = useColors();
  const { data, isLoading } = useListingOffers(isOwner ? listingId : '');
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  const counterOffer = useCounterOffer();
  const [counterTarget, setCounterTarget] = useState<OfferSummary | null>(null);

  if (!isOwner) return null;
  const offers = data?.items ?? [];

  const handleCounter = async (amount: number, message?: string) => {
    if (!counterTarget) return;
    await counterOffer.mutateAsync({ offerId: counterTarget.id, amount, message });
    setCounterTarget(null);
    Alert.alert('Başarılı', 'Karşı teklif gönderildi');
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.title, { color: colors.foreground }]}>Gelen Teklifler ({offers.length})</Text>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 16 }} />
      ) : offers.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>Henüz teklif yok</Text>
      ) : (
        offers.map((offer) => {
          const canAct = offer.status === 'pending' || offer.status === 'countered';
          const isMyTurn = offer.offeredBy !== currentUserId;
          return (
            <View key={offer.id} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.buyerName, { color: colors.foreground }]}>
                  {offer.buyer?.name ?? 'Alıcı'}
                </Text>
                <Text style={[styles.amount, { color: colors.primary }]}>{formatPrice(offer.amount)}</Text>
              </View>
              {offer.message ? (
                <Text style={[styles.message, { color: colors.mutedForeground }]}>{offer.message}</Text>
              ) : null}
              <Text style={[styles.status, { color: colors.mutedForeground }]}>
                {offer.status === 'pending' ? 'Bekliyor' : offer.status === 'countered' ? 'Karşı teklif' : offer.status}
              </Text>

              {canAct && isMyTurn && (
                <View style={styles.actions}>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                    onPress={() =>
                      acceptOffer.mutateAsync({ offerId: offer.id }).then(() =>
                        Alert.alert('Başarılı', 'Teklif kabul edildi — alıcıya özel fiyat uygulandı'),
                      )
                    }
                  >
                    <Text style={styles.actionText}>Kabul Et</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                    onPress={() => setCounterTarget(offer)}
                  >
                    <Text style={[styles.actionText, { color: colors.primary }]}>Karşı Teklif</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.actionBtn, { backgroundColor: '#FFEBEE' }]}
                    onPress={() =>
                      rejectOffer.mutateAsync({ offerId: offer.id }).then(() =>
                        Alert.alert('Teklif reddedildi'),
                      )
                    }
                  >
                    <Text style={[styles.actionText, { color: '#C62828' }]}>Reddet</Text>
                  </Pressable>
                </View>
              )}
            </View>
          );
        })
      )}

      <OfferModal
        visible={!!counterTarget}
        listingTitle={listingTitle}
        listingPrice={listingPrice}
        title="Karşı Teklif Ver"
        onClose={() => setCounterTarget(null)}
        onSubmit={handleCounter}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, gap: 10 },
  title: { fontSize: 18, fontWeight: '700' },
  empty: { fontSize: 14, fontStyle: 'italic' },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  buyerName: { fontSize: 15, fontWeight: '700' },
  amount: { fontSize: 18, fontWeight: '800' },
  message: { fontSize: 13, lineHeight: 18 },
  status: { fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  actionBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  actionText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
