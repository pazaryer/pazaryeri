import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { WebShell } from '@/components/web/WebShell';
import { WebPage } from '@/components/web/WebPage';
import {
  useListing,
  useToggleFavorite,
  useStartConversation,
  formatPrice,
  formatTimeAgo,
} from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';

export function WebListingDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile } = useAuth();
  const { data: listing, isLoading } = useListing(id);
  const toggleFavorite = useToggleFavorite();
  const startConversation = useStartConversation();
  const [activeImage, setActiveImage] = useState(0);

  if (isLoading || !listing) {
    return (
      <WebShell hideFooter>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3D1A78" />
        </View>
      </WebShell>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const isOwner = profile?.id === listing.sellerId;
  const isWide = width >= 900;

  const handleChat = async () => {
    if (!user) {
      router.push('/giris');
      return;
    }
    try {
      const convo = await startConversation.mutateAsync({ listingId: listing.id });
      router.push(`/chat/${convo.id}`);
    } catch (e: any) {
      Alert.alert('Hata', e.message ?? 'Sohbet başlatılamadı');
    }
  };

  return (
    <WebShell hideFooter>
      <WebPage>
      <ScrollView style={styles.page} contentContainerStyle={styles.pageContent}>
        <Pressable style={styles.back} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>Geri</Text>
        </Pressable>

        <View style={[styles.layout, isWide && styles.layoutWide]}>
          <View style={[styles.gallery, isWide && styles.galleryWide]}>
            <Image source={{ uri: images[activeImage] }} style={styles.mainImage} contentFit="cover" />
            {images.length > 1 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbs}>
                {images.map((img, i) => (
                  <Pressable key={i} onPress={() => setActiveImage(i)}>
                    <Image
                      source={{ uri: img }}
                      style={[styles.thumb, activeImage === i && styles.thumbActive]}
                      contentFit="cover"
                    />
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          <View style={[styles.info, isWide && styles.infoWide]}>
            <Text style={styles.price}>{formatPrice(listing.price)}</Text>
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
              <Image
                source={{
                  uri: listing.seller.avatar ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(listing.seller.name)}`,
                }}
                style={styles.sellerAvatar}
              />
              <View>
                <Text style={styles.sellerName}>{listing.seller.name}</Text>
                <Text style={styles.sellerMeta}>
                  ★ {listing.seller.rating} · {listing.seller.totalSales} satış
                </Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Açıklama</Text>
            <Text style={styles.description}>{listing.description || 'Açıklama eklenmemiş.'}</Text>

            {!isOwner && listing.status === 'active' && (
              <View style={styles.actions}>
                <Pressable style={styles.chatBtn} onPress={handleChat} disabled={startConversation.isPending}>
                  {startConversation.isPending ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Text style={styles.chatIcon}>💬</Text>
                      <Text style={styles.chatBtnText}>
                        {user ? 'Satıcıyla Sohbet Et' : 'Sohbet için Giriş Yap'}
                      </Text>
                    </>
                  )}
                </Pressable>
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
          </View>
        </View>
      </ScrollView>
      </WebPage>
    </WebShell>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, width: '100%' },
  pageContent: { maxWidth: 1200, width: '100%', alignSelf: 'center', padding: 24, paddingBottom: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },
  back: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 20 },
  backIcon: { color: '#3D1A78', fontSize: 18, fontWeight: '700' },
  backText: { color: '#3D1A78', fontWeight: '600', fontSize: 14 },
  layout: { gap: 24 },
  layoutWide: { flexDirection: 'row', alignItems: 'flex-start' },
  gallery: { gap: 12 },
  galleryWide: { flex: 1.2 },
  mainImage: { width: '100%', aspectRatio: 4 / 3, borderRadius: 16, backgroundColor: '#EDE8F5' },
  thumbs: { flexDirection: 'row' },
  thumb: { width: 72, height: 72, borderRadius: 10, marginRight: 8, opacity: 0.7 },
  thumbActive: { opacity: 1, borderWidth: 2, borderColor: '#3D1A78' },
  info: { gap: 12 },
  infoWide: { flex: 1, paddingTop: 8 },
  price: { fontSize: 32, fontWeight: '800', color: '#3D1A78' },
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
  sellerAvatar: { width: 48, height: 48, borderRadius: 24 },
  sellerName: { fontSize: 16, fontWeight: '700', color: '#1A0A2E' },
  sellerMeta: { fontSize: 13, color: '#7A6B8A', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1A0A2E', marginTop: 12 },
  description: { fontSize: 15, color: '#7A6B8A', lineHeight: 24 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  chatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3D1A78',
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 50,
  },
  chatBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15 },
  chatIcon: { fontSize: 16 },
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
