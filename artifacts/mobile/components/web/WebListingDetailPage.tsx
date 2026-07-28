import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebShell } from '@/components/web/WebShell';
import {
  useListing,
  useToggleFavorite,
  useStartConversation,
  formatPrice,
  formatTimeAgo,
} from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { ListingOwnerActions } from '@/components/ListingOwnerActions';
import { ContactActions } from '@/components/ContactActions';
import { UserAvatar } from '@/components/UserAvatar';
import { WebImage } from '@/components/WebImage';
import { getListingContactPhone } from '@/lib/contact';
import { showAlert } from '@/lib/web-alert';
import { useIsMobileWeb } from '@/hooks/useIsMobileWeb';

export function WebListingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const mobileWeb = useIsMobileWeb();
  const { user, profile } = useAuth();
  const listingId = Array.isArray(id) ? id[0] : id;
  const { data: listing, isLoading, isError, error, refetch, isFetching } = useListing(listingId ?? '');
  const toggleFavorite = useToggleFavorite();
  const startConversation = useStartConversation();
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading || (isFetching && !listing)) {
    return (
      <WebShell hideFooter>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3D1A78" />
        </View>
      </WebShell>
    );
  }

  if (isError || !listing) {
    return (
      <WebShell hideFooter>
        <View style={styles.center}>
          <Text style={styles.errorTitle}>İlan yüklenemedi</Text>
          <Text style={styles.errorSub}>
            {error instanceof Error ? error.message : 'İlan bulunamadı'}
          </Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Tekrar Dene</Text>
          </Pressable>
        </View>
      </WebShell>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const isOwner = profile?.id === listing.sellerId;
  const isWide = width >= 900;
  const contactPhone = getListingContactPhone(listing);

  const handleChat = async () => {
    if (!user) {
      router.push('/giris');
      return;
    }
    try {
      const convo = await startConversation.mutateAsync({ listingId: listing.id });
      router.push(`/chat/${convo.id}`);
    } catch (e: any) {
      showAlert('Hata', e.message ?? 'Sohbet başlatılamadı');
    }
  };

  const openImageFullscreen = () => {
    if (typeof window !== 'undefined') {
      window.open(images[activeImage], '_blank', 'noopener,noreferrer');
    }
  };

  const content = (
    <>
      <Pressable style={styles.back} onPress={() => router.back()}>
        <Text style={styles.backIcon}>←</Text>
        <Text style={styles.backText}>Geri</Text>
      </Pressable>

      <View nativeID="pz-listing-detail" style={[styles.layout, isWide && styles.layoutWide]}>
        <View style={[styles.gallery, isWide && styles.galleryWide]}>
          <Pressable onPress={openImageFullscreen} style={styles.mainImageWrap}>
            <WebImage
              uri={images[activeImage]}
              alt={listing.title}
              style={[styles.mainImage, mobileWeb && styles.mainImageMobile]}
            />
          </Pressable>
          {images.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.thumbs}>
              {images.map((img, i) => (
                <Pressable key={i} onPress={() => setActiveImage(i)}>
                  <WebImage
                    uri={img}
                    alt={`${listing.title} ${i + 1}`}
                    style={[styles.thumb, activeImage === i && styles.thumbActive]}
                  />
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={[styles.info, isWide && styles.infoWide]}>
          <Text style={[styles.price, mobileWeb && styles.priceMobile]}>{formatPrice(listing.price)}</Text>
          <Text style={styles.title}>{listing.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>📍</Text>
              <Text style={styles.metaText}>{listing.city ?? listing.location ?? 'Türkiye'}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>🕐</Text>
              <Text style={styles.metaText}>{formatTimeAgo(listing.createdAt)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={styles.metaIcon}>👁️</Text>
              <Text style={styles.metaText}>{listing.views} görüntülenme</Text>
            </View>
          </View>

          <View style={styles.seller}>
            <UserAvatar name={listing.seller.name} avatar={listing.seller.avatar} size={48} />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{listing.seller.name}</Text>
              <Text style={styles.sellerMeta}>
                ★ {listing.seller.rating} · {listing.seller.totalSales} satış
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>Açıklama</Text>
          <Text style={styles.description}>{listing.description || 'Açıklama eklenmemiş.'}</Text>

          <View style={styles.safetyBox}>
            <Text style={styles.safetyIcon}>🛡️</Text>
            <Text style={styles.safetyText}>
              Güvenliğiniz için ödeme ve teslimatı yüz yüze yapmayı tercih edin.
            </Text>
          </View>

          {!isOwner && listing.status === 'active' && (
            <View style={styles.actions}>
              <ContactActions
                phone={contactPhone}
                listingTitle={listing.title}
                onMessage={handleChat}
                messageLoading={startConversation.isPending}
              />
              {user && (
                <Pressable
                  style={styles.favBtn}
                  onPress={() =>
                    toggleFavorite.mutate({ listingId: listing.id, isFavorite: listing.isFavorite })
                  }
                >
                  <Text style={styles.favIcon}>{listing.isFavorite ? '❤️' : '🤍'}</Text>
                </Pressable>
              )}
            </View>
          )}

          {listing.status === 'sold' && (
            <View style={styles.soldBadge}>
              <Text style={styles.soldBadgeText}>Bu ilan satıldı</Text>
            </View>
          )}

          {isOwner && (
            <ListingOwnerActions
              listingId={listing.id}
              status={listing.status}
              onDeleted={() => router.replace('/hesabim')}
            />
          )}
        </View>
      </View>
    </>
  );

  return (
    <WebShell hideFooter>
      {mobileWeb ? (
        <View style={styles.page}>
          <View style={[styles.pageContent, styles.pageContentMobile]}>{content}</View>
        </View>
      ) : (
        <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
          {content}
        </ScrollView>
      )}
    </WebShell>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%', backgroundColor: '#F7F5FC' },
  pageContent: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    paddingBottom: 60,
  },
  pageContentMobile: { paddingHorizontal: 12, paddingVertical: 12, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  errorTitle: { fontSize: 18, fontWeight: '700', marginBottom: 8, color: '#1A0A2E' },
  errorSub: { color: '#666', marginBottom: 16, textAlign: 'center', paddingHorizontal: 24 },
  retryBtn: { backgroundColor: '#3D1A78', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryText: { color: '#FFF', fontWeight: '700' },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  backIcon: { color: '#3D1A78', fontSize: 18, fontWeight: '700' },
  backText: { color: '#3D1A78', fontWeight: '600', fontSize: 14 },
  layout: { gap: 20 },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start', gap: 32 },
  gallery: { gap: 12, width: '100%' },
  galleryWide: { flex: 1.1, minWidth: 0 },
  mainImageWrap: { width: '100%', borderRadius: 16, overflow: 'hidden', backgroundColor: '#EDE8F5' },
  mainImage: { width: '100%', height: 360, borderRadius: 16, backgroundColor: '#EDE8F5' },
  mainImageMobile: { height: 260, borderRadius: 12 },
  thumbs: { gap: 8, paddingVertical: 4 },
  thumb: { width: 72, height: 72, borderRadius: 10, opacity: 0.7, backgroundColor: '#EDE8F5' },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#3D1A78' },
  info: { gap: 12, width: '100%' },
  infoWide: { flex: 1, minWidth: 0, paddingTop: 4 },
  price: { fontSize: 32, fontWeight: '800', color: '#3D1A78' },
  priceMobile: { fontSize: 26 },
  title: { fontSize: 22, fontWeight: '700', color: '#1A0A2E', lineHeight: 30 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 4 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaIcon: { fontSize: 13 },
  metaText: { fontSize: 13, color: '#7A6B8A' },
  seller: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2D9F0',
    marginTop: 8,
  },
  sellerInfo: { flex: 1, minWidth: 0 },
  sellerName: { fontSize: 16, fontWeight: '700', color: '#1A0A2E' },
  sellerMeta: { fontSize: 13, color: '#7A6B8A', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A0A2E', marginTop: 12 },
  description: { fontSize: 15, color: '#7A6B8A', lineHeight: 24 },
  safetyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#F4F1FA',
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8E0F4',
  },
  safetyIcon: { fontSize: 20 },
  safetyText: { flex: 1, fontSize: 13, color: '#1A0A2E', lineHeight: 20 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20, alignItems: 'center', flexWrap: 'wrap' },
  favBtn: {
    width: 50,
    height: 50,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#3D1A78',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favIcon: { fontSize: 20 },
  soldBadge: {
    marginTop: 16,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  soldBadgeText: { color: '#C62828', fontWeight: '700' },
});
