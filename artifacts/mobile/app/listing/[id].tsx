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
import {
  useListing,
  useToggleFavorite,
  useStartConversation,
  useCreateReport,
  formatPrice,
  formatTimeAgo,
} from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();

  const { data: listing, isLoading } = useListing(id);
  const toggleFavorite = useToggleFavorite();
  const startConversation = useStartConversation();
  const createReport = useCreateReport();

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  if (isLoading || !listing) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const images = listing.images.length > 0 ? listing.images : [listing.image];
  const isOwner = profile?.id === listing.sellerId;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${listing.title} - ${formatPrice(listing.price)}\nhttps://pazaryeri.app/listing/${listing.id}`,
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
              <Image key={idx} source={{ uri: img }} style={{ width: SCREEN_WIDTH, height: SCREEN_HEIGHT * 0.45 }} contentFit="cover" />
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
                onPress={() => toggleFavorite.mutate({ listingId: listing.id, isFavorite: listing.isFavorite })}
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
              <Text style={[styles.infoText, { color: colors.mutedForeground }]}>{listing.views}</Text>
            </View>
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
        </View>
      </ScrollView>

      {!isOwner && listing.status === 'active' && (
        <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <Pressable style={[styles.offerButton, { borderColor: colors.primary }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
});
