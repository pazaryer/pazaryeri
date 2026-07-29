import React, { useState, useEffect, useRef } from 'react';
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
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { FavoriteButton } from '@/components/FavoriteButton';
import { ImageGalleryModal } from '@/components/ImageGalleryModal';
import { ContactActions } from '@/components/ContactActions';
import { ReviewModal } from '@/components/ReviewModal';
import { UserAvatar } from '@/components/UserAvatar';
import { UserNameWithBadge } from '@/components/UserNameWithBadge';
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
import { formatListingLocation } from '@/lib/listing-location';
import { getCategoryIcon } from '@/lib/categories';
import { BRAND } from '@/constants/brand';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_HEIGHT = Math.min(SCREEN_HEIGHT * 0.46, 420);

export default function ListingDetailScreen() {
  if (Platform.OS === 'web') {
    return <WebListingDetailPage />;
  }
  return <MobileListingDetailScreen />;
}

function SectionCard({
  title,
  icon,
  children,
  noPadding,
}: {
  title?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
  noPadding?: boolean;
}) {
  return (
    <View style={styles.sectionCard}>
      {title ? (
        <View style={styles.sectionHeader}>
          {icon ? (
            <View style={styles.sectionIconWrap}>
              <Ionicons name={icon} size={16} color={BRAND.primary} />
            </View>
          ) : null}
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      ) : null}
      <View style={noPadding ? undefined : styles.sectionBody}>{children}</View>
    </View>
  );
}

function MetaChip({
  icon,
  label,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={14} color={BRAND.primaryMid} />
      <Text style={styles.metaChipText} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

function MobileListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile, user } = useAuth();
  const galleryRef = useRef<ScrollView>(null);

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

  const scrollToImage = (idx: number) => {
    setActiveImageIndex(idx);
    galleryRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const onGalleryScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    setActiveImageIndex(Math.round(x / SCREEN_WIDTH));
  };

  if (isLoading || (isFetching && !listing)) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: BRAND.background }]}>
        <ActivityIndicator size="large" color={BRAND.primary} />
        <Text style={styles.loadingText}>İlan yükleniyor...</Text>
      </View>
    );
  }

  if (isError || !listing) {
    return (
      <View style={[styles.container, { backgroundColor: BRAND.background, paddingTop: insets.top + 16 }]}>
        <Pressable style={styles.glassBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={BRAND.text} />
        </Pressable>
        <View style={styles.errorWrap}>
          <View style={styles.errorIconWrap}>
            <Ionicons name="alert-circle-outline" size={40} color={BRAND.primary} />
          </View>
          <Text style={styles.errorTitle}>İlan yüklenemedi</Text>
          <Text style={styles.errorSub}>
            {error instanceof Error ? error.message : 'İlan bulunamadı veya bağlantı hatası oluştu.'}
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const isOwner = profile?.id === listing.sellerId;
  const contactPhone = getListingContactPhone(listing);
  const locationLabel = formatListingLocation(listing) || 'Konum belirtilmemiş';
  const categoryIcon = getCategoryIcon(listing.category);

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
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Sohbet başlatılamadı';
      Alert.alert('Hata', msg);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${listing.title} - ${formatPrice(listing.price)}\n${sitePath(`/listing/${listing.id}`)}`,
      });
    } catch {
      /* ignore */
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
    <View style={[styles.container, { backgroundColor: BRAND.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: !isOwner && listing.status === 'active' ? 120 : 40 }}
      >
        {/* ——— Hero galeri ——— */}
        <View style={styles.hero}>
          <ScrollView
            ref={galleryRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onGalleryScroll}
            scrollEventThrottle={16}
          >
            {images.map((img, idx) => (
              <Pressable key={`${listing.id}-img-${idx}`} onPress={() => openGallery(idx)}>
                <Image
                  source={{ uri: img }}
                  style={styles.heroImage}
                  contentFit="cover"
                  recyclingKey={`${listing.id}-${idx}`}
                  {...listingHeroImageProps}
                />
              </Pressable>
            ))}
          </ScrollView>

          <LinearGradient
            colors={['rgba(26,10,46,0.45)', 'transparent', 'rgba(26,10,46,0.55)']}
            locations={[0, 0.35, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />

          <View style={[styles.topBar, { paddingTop: Math.max(insets.top, 12) }]}>
            <Pressable style={styles.glassBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={22} color={BRAND.text} />
            </Pressable>
            <View style={styles.topBarRight}>
              <Pressable style={styles.glassBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={BRAND.text} />
              </Pressable>
              <Pressable style={styles.glassBtn} onPress={handleReport}>
                <Ionicons name="flag-outline" size={19} color={BRAND.text} />
              </Pressable>
              <FavoriteButton isFavorite={listing.isFavorite} onPress={handleFavorite} size={22} />
            </View>
          </View>

          {images.length > 1 && (
            <View style={styles.imageCounter}>
              <Text style={styles.imageCounterText}>
                {activeImageIndex + 1} / {images.length}
              </Text>
            </View>
          )}

          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, idx) => (
                <Pressable key={idx} onPress={() => scrollToImage(idx)} hitSlop={8}>
                  <View style={[styles.dot, activeImageIndex === idx && styles.dotActive]} />
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* ——— İçerik kartı ——— */}
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.priceBlock}>
            <View style={styles.categoryChip}>
              <Ionicons name={categoryIcon} size={13} color={BRAND.primary} />
              <Text style={styles.categoryChipText}>{listing.category}</Text>
            </View>
            {listing.status === 'sold' && (
              <View style={styles.soldBadge}>
                <Text style={styles.soldBadgeText}>Satıldı</Text>
              </View>
            )}
          </View>

          <Text style={styles.price}>{formatPrice(listing.price)}</Text>
          {listing.hasNegotiatedPrice && listing.originalPrice != null && (
            <Text style={styles.originalPrice}>İlan fiyatı: {formatPrice(listing.originalPrice)}</Text>
          )}

          <Text style={styles.title}>{listing.title}</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.metaRow}
          >
            <MetaChip icon="location-outline" label={locationLabel} />
            <MetaChip icon="time-outline" label={formatTimeAgo(listing.createdAt)} />
            <MetaChip icon="heart" label={`${listing.favoriteCount} favori`} />
            {isOwner && (
              <MetaChip icon="eye-outline" label={`${listing.views ?? 0} görüntülenme`} />
            )}
          </ScrollView>

          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbRow}
            >
              {images.map((img, idx) => (
                <Pressable
                  key={`thumb-${idx}`}
                  onPress={() => scrollToImage(idx)}
                  style={[styles.thumbWrap, activeImageIndex === idx && styles.thumbWrapActive]}
                >
                  <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" />
                </Pressable>
              ))}
            </ScrollView>
          )}

          {isOwner && (
            <View style={styles.ownerInsights}>
              <ListingInsightsPanel listingId={listing.id} />
            </View>
          )}

          {/* Satıcı */}
          <SectionCard title="Satıcı" icon="person-outline">
            <View style={styles.sellerRow}>
              <UserAvatar name={listing.seller.name} avatar={listing.seller.avatar} size={52} />
              <View style={styles.sellerInfo}>
                <View style={styles.sellerNameRow}>
                  <UserNameWithBadge
                    name={listing.seller.name}
                    badge={(listing.seller as { badge?: { emoji: string; label: string; color?: string } }).badge}
                    nameStyle={styles.sellerName}
                  />
                </View>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={14} color={BRAND.gold} />
                  <Text style={styles.ratingText}>
                    {listing.seller.rating > 0 ? listing.seller.rating.toFixed(1) : '—'} ·{' '}
                    {listing.seller.totalSales} satış
                  </Text>
                </View>
              </View>
            </View>
            {!isOwner && user ? (
              <View style={styles.sellerActions}>
                <Pressable onPress={() => setReviewOpen(true)} style={styles.reviewBtn}>
                  <Ionicons name="star-outline" size={16} color={BRAND.primary} />
                  <Text style={styles.reviewBtnText}>Değerlendir</Text>
                </Pressable>
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
                  style={styles.blockBtn}
                >
                  <Ionicons name="ban-outline" size={16} color={BRAND.textMuted} />
                </Pressable>
              </View>
            ) : null}
          </SectionCard>

          {/* Açıklama */}
          <SectionCard title="Açıklama" icon="document-text-outline">
            <Text style={styles.description}>
              {listing.description?.trim() || 'Satıcı henüz açıklama eklememiş.'}
            </Text>
          </SectionCard>

          {/* Konum */}
          <SectionCard noPadding>
            <View style={styles.embedSection}>
              <ListingMapPin
                latitude={listing.latitude}
                longitude={listing.longitude}
                title={listing.title}
                city={listing.city}
                district={listing.district}
              />
            </View>
          </SectionCard>

          {/* Teklifler */}
          {!isOwner && listing.status === 'active' && (
            <SectionCard noPadding>
              <View style={styles.embedSection}>
                <BuyerOfferSection
                  listingId={listing.id}
                  listingTitle={listing.title}
                  listingPrice={listing.originalPrice ?? listing.price}
                  acceptsOffers={listing.acceptsOffers}
                  userId={profile?.id}
                />
              </View>
            </SectionCard>
          )}

          {isOwner && (
            <SectionCard noPadding>
              <View style={styles.embedSection}>
                <ListingOffersSection
                  listingId={listing.id}
                  listingTitle={listing.title}
                  listingPrice={listing.price}
                  isOwner={isOwner}
                  currentUserId={profile?.id}
                />
              </View>
            </SectionCard>
          )}

          {/* Yorumlar */}
          <SectionCard noPadding>
            <View style={styles.embedSection}>
              <ListingCommentsSection listingId={listing.id} sellerId={listing.sellerId} />
            </View>
          </SectionCard>

          {/* Güvenlik */}
          <LinearGradient
            colors={[BRAND.primaryLight, '#FFFFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.safetyBox}
          >
            <View style={styles.safetyIconWrap}>
              <Ionicons name="shield-checkmark" size={22} color={BRAND.primary} />
            </View>
            <Text style={styles.safetyText}>
              Güvenliğiniz için ödemeyi ve teslimatı mümkünse yüz yüze yapın. Şüpheli durumları bize bildirin.
            </Text>
          </LinearGradient>

          {isOwner && (
            <View style={styles.ownerActions}>
              <ListingOwnerActions
                listingId={listing.id}
                status={listing.status}
                onDeleted={() => router.replace('/(tabs)/profile')}
              />
            </View>
          )}
        </View>
      </ScrollView>

      {!isOwner && listing.status === 'active' && (
        <View
          style={[
            styles.footer,
            {
              paddingBottom: Math.max(insets.bottom, 14),
              backgroundColor: colors.card,
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(247,245,252,0)', 'rgba(255,255,255,0.98)']}
            style={styles.footerFade}
            pointerEvents="none"
          />
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
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: BRAND.textMuted, fontWeight: '600' },
  hero: { height: HERO_HEIGHT, backgroundColor: '#1A0A2E' },
  heroImage: { width: SCREEN_WIDTH, height: HERO_HEIGHT },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  glassBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.94)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.7)',
    shadowColor: BRAND.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    right: 16,
    backgroundColor: 'rgba(26,10,46,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  imageCounterText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
  dotsRow: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: { width: 22, backgroundColor: '#FFF' },
  sheet: {
    marginTop: -28,
    backgroundColor: BRAND.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    minHeight: 200,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BRAND.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  priceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: BRAND.primaryLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BRAND.primaryMuted,
  },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: BRAND.primary },
  soldBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFCDD2',
  },
  soldBadgeText: { color: '#C62828', fontSize: 12, fontWeight: '800' },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: BRAND.primary,
    letterSpacing: -0.8,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 13,
    color: BRAND.textMuted,
    textDecorationLine: 'line-through',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: BRAND.text,
    lineHeight: 30,
    letterSpacing: -0.3,
    marginBottom: 14,
  },
  metaRow: { gap: 8, paddingBottom: 4 },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BRAND.border,
    maxWidth: 220,
  },
  metaChipText: { fontSize: 12, fontWeight: '600', color: BRAND.textMuted, flexShrink: 1 },
  thumbRow: { gap: 10, paddingVertical: 16 },
  thumbWrap: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbWrapActive: { borderColor: BRAND.primary },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: BRAND.primaryMuted },
  embedSection: { paddingHorizontal: 16, paddingVertical: 12 },
  ownerInsights: { marginTop: 8, marginBottom: 4 },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: BRAND.border,
    marginTop: 14,
    overflow: 'hidden',
    shadowColor: BRAND.primaryDark,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  sectionIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: BRAND.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: BRAND.text },
  sectionBody: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8 },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  sellerInfo: { flex: 1 },
  sellerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  sellerName: { fontSize: 17, fontWeight: '800', color: BRAND.text },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 13, color: BRAND.textMuted, fontWeight: '600' },
  sellerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
  },
  reviewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BRAND.primaryLight,
    borderWidth: 1,
    borderColor: BRAND.primaryMuted,
  },
  reviewBtnText: { fontSize: 13, fontWeight: '700', color: BRAND.primary },
  blockBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BRAND.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BRAND.background,
  },
  description: { fontSize: 15, lineHeight: 24, color: BRAND.textMuted },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: BRAND.primaryMuted,
  },
  safetyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  safetyText: { flex: 1, fontSize: 13, fontWeight: '600', color: BRAND.text, lineHeight: 20 },
  ownerActions: { marginTop: 16 },
  footer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: BRAND.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  footerFade: {
    position: 'absolute',
    top: -24,
    left: 0,
    right: 0,
    height: 24,
  },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, gap: 10 },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BRAND.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  errorTitle: { fontSize: 20, fontWeight: '800', color: BRAND.text },
  errorSub: { fontSize: 14, textAlign: 'center', lineHeight: 21, color: BRAND.textMuted },
  retryBtn: {
    marginTop: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: BRAND.primary,
  },
  retryBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
