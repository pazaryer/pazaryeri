import React, { useState, useEffect } from 'react';
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
import { ContactActions } from '@/components/ContactActions';
import { ReviewModal } from '@/components/ReviewModal';
import { UserAvatar } from '@/components/UserAvatar';
import { WebListingDetailPage } from '@/components/web/WebListingDetailPage';
import {
  useListing,
  useToggleFavorite,
  useStartConversation,
  useCreateReport,
  useCreateReview,
  useBlockUser,
  formatPrice,
  formatTimeAgo,
} from '@/lib/hooks';
import { getListingContactPhone } from '@/lib/contact';
import { useAuth } from '@/contexts/AuthContext';
import { sitePath } from '@/lib/config';
import { ListingOwnerActions } from '@/components/ListingOwnerActions';
import { ListingInsightsPanel } from '@/components/ListingInsightsPanel';
import { ListingOffersSection } from '@/components/ListingOffersSection';
import { BuyerOfferSection } from '@/components/BuyerOfferSection';
import { ListingMapPin } from '@/components/ListingMapPin';
import { ListingCommentsSection } from '@/components/ListingCommentsSection';
import { listingHeroImageProps } from '@/lib/listing-image-props';

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
  const createReview = useCreateReview();
  const blockUser = useBlockUser();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [reviewOpen, setReviewOpen] = useState(false);

  useEffect(() => {
    if (!listing) return;
    const imgs = listing.images.length > 0 ? listing.images : [listing.image];
    imgs.slice(0, 5).forEach((uri) => {
      if (uri) Image.prefetch(uri);
    });
  }, [listing?.id, listing?.images, listing?.image]);

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
  const contactPhone = getListingContactPhone(listing);

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

  const handleChat = async () => {
    if (!user) {
      Alert.alert('Giriş gerekli', 'Mesaj göndermek için giriş yapın');
      return;
    }
    try {
      const convo = await startConversation.mutateAsync({ listingId: listing.id });
      router.push(`/chat/${convo.id}`);
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Sohbet başlatılamadı');
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${listing.title} - ${formatPrice(listing.price)}\n${sitePath(`/listing/${listing.id}`)}`,
      });
    } catch {}
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
                <Image
                  source={{ uri: img }}
                  style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.45 }}
                  contentFit="cover"
                  recyclingKey={`${listing.id}-${idx}`}
                  {...listingHeroImageProps}
                />
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
            <View>
              <Text style={[styles.price, { color: colors.primary }]}>{formatPrice(listing.price)}</Text>
              {listing.hasNegotiatedPrice && listing.originalPrice != null && (
                <Text style={[styles.originalPrice, { color: colors.mutedForeground }]}>
                  İlan fiyatı: {formatPrice(listing.originalPrice)}
                </Text>
              )}
            </View>
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
            {isOwner && (
              <View style={styles.infoItem}>
                <Ionicons name="eye-outline" size={16} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {listing.views ?? 0} görüntülenme
                </Text>
              </View>
            )}
            <View style={styles.infoItem}>
              <Ionicons name="heart" size={16} color={colors.mutedForeground} />
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                {listing.favoriteCount} favori
              </Text>
            </View>
          </View>

          {isOwner && <ListingInsightsPanel listingId={listing.id} />}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.sellerCard}>
            <UserAvatar name={listing.seller.name} avatar={listing.seller.avatar} size={48} />
            <View style={[styles.sellerInfo, { marginLeft: 12 }]}>
              <View style={styles.sellerNameRow}>
                <Text style={[styles.sellerName, { color: colors.foreground }]}>{listing.seller.name}</Text>
                {listing.seller.isVerified && <Ionicons name="checkmark-circle" size={16} color={colors.primary} />}
              </View>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>
                  {listing.seller.rating > 0 ? listing.seller.rating.toFixed(1) : '—'} ({listing.seller.totalSales} yorum)
                </Text>
              </View>
            </View>
            {!isOwner && user && (
              <Pressable onPress={() => setReviewOpen(true)} style={[styles.reviewBtn, { borderColor: colors.primary }]}>
                <Text style={[styles.reviewBtnText, { color: colors.primary }]}>Değerlendir</Text>
              </Pressable>
            )}
            {!isOwner && user && (
              <Pressable
                onPress={() =>
                  Alert.alert('Kullanıcıyı Engelle', `${listing.seller.name} engellensin mi?`, [
                    { text: 'İptal', style: 'cancel' },
                    {
                      text: 'Engelle',
                      style: 'destructive',
                      onPress: () =>
                        blockUser.mutateAsync(listing.sellerId).then(() =>
                          Alert.alert('Engellendi', 'Bu kullanıcıyla iletişim kuramazsınız'),
                        ),
                    },
                  ])
                }
                hitSlop={8}
              >
                <Ionicons name="ban-outline" size={22} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <ListingMapPin
            latitude={listing.latitude}
            longitude={listing.longitude}
            title={listing.title}
            city={listing.city}
            district={listing.district}
          />

          {!isOwner && listing.status === 'active' && (
            <BuyerOfferSection
              listingId={listing.id}
              listingTitle={listing.title}
              listingPrice={listing.originalPrice ?? listing.price}
              acceptsOffers={listing.acceptsOffers}
              userId={profile?.id}
            />
          )}

          {isOwner && (
            <ListingOffersSection
              listingId={listing.id}
              listingTitle={listing.title}
              listingPrice={listing.price}
              isOwner={isOwner}
              currentUserId={profile?.id}
            />
          )}

          <ListingCommentsSection listingId={listing.id} sellerId={listing.sellerId} />

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
          <ContactActions
            phone={contactPhone}
            listingTitle={listing.title}
            onMessage={handleChat}
            messageLoading={startConversation.isPending}
          />
        </View>
      )}

      <ImageGalleryModal
        images={images}
        initialIndex={galleryIndex}
        visible={galleryOpen}
        onClose={() => setGalleryOpen(false)}
      />

      <ReviewModal
        visible={reviewOpen}
        userName={listing.seller.name}
        onClose={() => setReviewOpen(false)}
        onSubmit={async (rating, comment) => {
          await createReview.mutateAsync({
            revieweeId: listing.sellerId,
            listingId: listing.id,
            rating,
            comment,
          });
          Alert.alert('Teşekkürler', 'Değerlendirmeniz kaydedildi');
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
  originalPrice: { fontSize: 13, textDecorationLine: 'line-through', marginTop: 2 },
  badge: { backgroundColor: '#E8F5E9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { color: '#2E7D32', fontSize: 12, fontWeight: '700' },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 16, lineHeight: 28 },
  infoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  infoText: { fontSize: 13 },
  divider: { height: 1, width: '100%', marginVertical: 20 },
  sellerCard: { flexDirection: 'row', alignItems: 'center' },
  reviewBtn: { marginTop: 10, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, borderWidth: 1 },
  reviewBtnText: { fontSize: 12, fontWeight: '700' },
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
  footer: { position: 'absolute', bottom: 0, width: '100%', paddingTop: 12, paddingHorizontal: 16, borderTopWidth: 1 },
});
