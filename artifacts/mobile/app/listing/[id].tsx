import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { OfferModal } from '@/components/OfferModal';
import { ListingOffersSection } from '@/components/ListingOffersSection';
import { WebListingDetailPage } from '@/components/web/WebListingDetailPage';
import {
  useListing,
  useToggleFavorite,
  useStartConversation,
  useCreateReport,
  useCreateOffer,
  useMyOffers,
  useAcceptOffer,
  useRejectOffer,
  useCounterOffer,
  formatPrice,
  formatTimeAgo,
} from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { sitePath } from '@/lib/config';
import { ListingOwnerActions } from '@/components/ListingOwnerActions';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  if (Platform.OS === 'web') {
    return <WebListingDetailPage />;
  }
  return <MobileListingDetailScreen />;
}

function MobileListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();

  const listingId = Array.isArray(id) ? id[0] : id;
  const { data: listing, isLoading, isError, error, refetch, isFetching } = useListing(listingId ?? '');
  const toggleFavorite = useToggleFavorite();
  const startConversation = useStartConversation();
  const createReport = useCreateReport();
  const createOffer = useCreateOffer();
  const { data: myOffersData } = useMyOffers();
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  const counterOffer = useCounterOffer();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [offerOpen, setOfferOpen] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);

  if (isLoading || (isFetching && !listing)) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.foreground} />
        </Pressable>
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>İlan yüklenemedi</Text>
          <Text style={[styles.errorSub, { color: colors.mutedForeground }]}>
            {error instanceof Error ? error.message : 'İlan bulunamadı veya bağlantı hatası oluştu.'}
          </Text>
          <Pressable style={[styles.retryBtn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const isOwner = profile?.id === listing.sellerId;
  const myActiveOffer = myOffersData?.items.find(
    (o) => o.listingId === listing.id && ['pending', 'countered'].includes(o.status),
  );

  const openGallery = (idx: number) => {
    setGalleryIndex(idx);
    setGalleryOpen(true);
  };

  const handleFavorite = () => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Favorilere eklemek için giriş yapın');
      return;
    }
    toggleFavorite.mutate({ listingId: listing.id, isFavorite: listing.isFavorite });
  };

  const handleOffer = async (amount: number, message?: string) => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Teklif vermek için giriş yapın');
      return;
    }
    await createOffer.mutateAsync({ listingId: listing.id, amount, message });
    Alert.alert('Başarılı', 'Teklifiniz gönderildi. Satıcı bilgilendirildi.');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${listing.title} - ${formatPrice(listing.price)}\n${sitePath(`/listing/${listing.id}`)}`,
      });
    } catch {}
  };

  const handleChat = async () => {
    try {
      const convo = await startConversation.mutateAsync({ listingId: listing.id });
      router.push(`/chat/${convo.id}`);
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Sohbet başlatılamadı');
    }
  };

  const handleReport = () => {
    Alert.alert('İlanı Şikayet Et', 'Bu ilanı neden şikayet ediyorsunuz?', [
      { text: 'Spam', onPress: () => createReport.mutate({ listingId: listing.id, reason: 'spam' }) },
      { text: 'Sahte İlan', onPress: () => createReport.mutate({ listingId: listing.id, reason: 'fake' }) },
      { text: 'Uygunsuz İçerik', onPress: () => createReport.mutate({ listingId: listing.id, reason: 'inappropriate' }) },
      { text: 'İptal', style: 'cancel' },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        <View style={{ height: SCREEN_HEIGHT * 0.45 }}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveImageIndex(Math.round(x / SCREEN_WIDTH));
            }}
            scrollEventThrottle={16}
          >
            {images.map((img, idx) => (
              <Pressable key={idx} onPress={() => openGallery(idx)}>
                <Image source={{ uri: img }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.45 }} contentFit="cover" />
              </Pressable>
            ))}
          </ScrollView>

          <View style={[styles.topActions, { top: Math.max(insets.top, 20) }]}>
            <Pressable style={styles.circleButton} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={24} color="#1A1A1A" />
            </Pressable>
            <View style={styles.rightActions}>
              <Pressable style={[styles.circleButton, { marginRight: 12 }]} onPress={handleShare}>
                <Ionicons name="share-outline" size={24} color="#1A1A1A" />
              </Pressable>
              <Pressable style={[styles.circleButton, { marginRight: 12 }]} onPress={handleReport}>
                <Ionicons name="flag-outline" size={22} color="#1A1A1A" />
              </Pressable>
              <FavoriteButton
                isFavorite={listing.isFavorite}
                onPress={handleFavorite}
              />
            </View>
          </View>

          {images.length > 1 && (
            <View style={styles.dotsContainer}>
              {images.map((_, idx) => (
                <View key={idx} style={[styles.dot, activeImageIndex === idx && { backgroundColor: colors.primary, width: 24 }]} />
              ))}
            </View>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(listing.price)}</Text>
            {listing.acceptsOffers && listing.status === 'active' && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Teklif Kabul</Text>
              </View>
            )}
            {listing.status === 'sold' && (
              <View style={[styles.badge, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.badgeText, { color: '#C62828' }]}>Satıldı</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{listing.title}</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="location-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {listing.location ?? listing.city ?? 'Konum belirtilmemiş'}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {formatTimeAgo(listing.createdAt)}
              </Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="eye-outline" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{listing.views} görüntülenme</Text>
            </View>
            {isOwner && listing.favoriteCount !== undefined && (
              <View style={styles.infoItem}>
                <Ionicons name="heart" size={16} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{listing.favoriteCount} favori</Text>
              </View>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.sellerCard}>
            <Image
              source={{ uri: listing.seller.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller.name)}` }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <View style={styles.sellerNameRow}>
                <Text style={[styles.sellerName, { color: colors.foreground }]}>{listing.seller.name}</Text>
                {listing.seller.isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                  {listing.seller.rating} ({listing.seller.totalSales} değerlendirme)
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Açıklama</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]}>
            {listing.description || 'Açıklama eklenmemiş.'}
          </Text>

          <View style={[styles.safetyBox, { backgroundColor: colors.secondary }]}>
            <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
            <Text style={[styles.safetyText, { color: colors.foreground }]}>
              Güvenliğiniz için ödeme ve teslimatı yüz yüze yapmayı tercih edin.
            </Text>
          </View>

          {isOwner && (
            <ListingOffersSection
              listingId={listing.id}
              listingTitle={listing.title}
              listingPrice={listing.price}
              isOwner={isOwner}
              currentUserId={profile?.id}
            />
          )}

          {!isOwner && myActiveOffer && (
            <View style={[styles.offerCard, { backgroundColor: colors.secondary, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Teklifiniz</Text>
              <Text style={[styles.offerAmount, { color: colors.primary }]}>{formatPrice(myActiveOffer.amount)}</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 13 }}>
                Durum: {myActiveOffer.status === 'countered' ? 'Karşı teklif geldi' : 'Beklemede'}
              </Text>
              {myActiveOffer.offeredBy !== profile?.id && (
                <View style={styles.offerActions}>
                  <Pressable
                    style={[styles.miniBtn, { backgroundColor: colors.primary }]}
                    onPress={() => acceptOffer.mutateAsync({ offerId: myActiveOffer.id }).then(() => Alert.alert('Kabul edildi'))}
                  >
                    <Text style={styles.miniBtnText}>Kabul Et</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.miniBtn, { borderColor: colors.primary, borderWidth: 1 }]}
                    onPress={() => setCounterOpen(true)}
                  >
                    <Text style={[styles.miniBtnText, { color: colors.primary }]}>Karşı Teklif</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.miniBtn, { backgroundColor: '#FFEBEE' }]}
                    onPress={() => rejectOffer.mutateAsync({ offerId: myActiveOffer.id })}
                  >
                    <Text style={[styles.miniBtnText, { color: '#C62828' }]}>Reddet</Text>
                  </Pressable>
                </View>
              )}
            </View>
          )}

          {isOwner && (
            <ListingOwnerActions
              listingId={listing.id}
              status={listing.status}
              onDeleted={() => router.replace('/(tabs)/profile')}
            />
          )}
        </View>
      </ScrollView>

      {!isOwner && listing.status === 'active' && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable
            style={[styles.offerButton, { borderColor: colors.primary }]}
            onPress={() => {
              if (!user) Alert.alert('Giriş gerekli', 'Teklif vermek için giriş yapın');
              else if (myActiveOffer) Alert.alert('Bilgi', 'Bu ilana zaten aktif teklifiniz var');
              else setOfferOpen(true);
            }}
          >
            <Text style={[styles.offerButtonText, { color: colors.primary }]}>Teklif Ver</Text>
          </Pressable>
          <Pressable
            style={[styles.chatButton, { backgroundColor: colors.primary }]}
            onPress={handleChat}
            disabled={startConversation.isPending}
          >
            {startConversation.isPending ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Ionicons name="chatbubble" size={20} color="#FFF" />
                <Text style={styles.chatButtonText}>Sohbet Başlat</Text>
              </>
            )}
          </Pressable>
        </View>
      )}

      <ImageGalleryModal
        images={images}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <OfferModal
        visible={offerOpen}
        listingTitle={listing.title}
        listingPrice={listing.price}
        onClose={() => setOfferOpen(false)}
        onSubmit={handleOffer}
      />

      <OfferModal
        visible={counterOpen}
        listingTitle={listing.title}
        listingPrice={listing.price}
        title="Karşı Teklif Ver"
        onClose={() => setCounterOpen(false)}
        onSubmit={async (amount, message) => {
          if (!myActiveOffer) return;
          await counterOffer.mutateAsync({ offerId: myActiveOffer.id, amount, message });
          Alert.alert('Başarılı', 'Karşı teklif gönderildi');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { padding: 16, alignSelf: 'flex-start' },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 12 },
  errorTitle: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  topActions: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  circleButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.85)', justifyContent: 'center', alignItems: 'center' },
  dotsContainer: { position: 'absolute', bottom: 16, flexDirection: 'row', width: '100%', justifyContent: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  content: { padding: 20 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, lineHeight: 28 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  sellerCard: { flexDirection: 'row', alignItems: 'center' },
  sellerAvatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  sellerInfo: { flex: 1 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  sellerName: { fontSize: 16, fontWeight: '700' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '700', marginBottom: 12 },
  description: { fontSize: 15, lineHeight: 24 },
  safetyBox: { flexDirection: 'row', padding: 16, borderRadius: 12, marginTop: 24, alignItems: 'center', gap: 12 },
  safetyText: { flex: 1, fontSize: 14, fontWeight: '500', lineHeight: 20 },
  footer: { position: 'absolute', bottom: 0, width: '100%', flexDirection: 'row', paddingTop: 16, paddingHorizontal: 16, borderTopWidth: 1, gap: 12 },
  offerButton: { flex: 1, height: 52, borderWidth: 2, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  offerButtonText: { fontSize: 16, fontWeight: '700' },
  chatButton: { flex: 1.5, height: 52, borderRadius: 16, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  chatButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  offerCard: { marginTop: 20, padding: 16, borderRadius: 14, borderWidth: 1, gap: 8 },
  offerAmount: { fontSize: 24, fontWeight: '800' },
  offerActions: { flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  miniBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  miniBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
});
