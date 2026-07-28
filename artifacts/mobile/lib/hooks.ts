import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { apiFetch } from './api';
import { updateWebProfile } from './web-profile';
import { updateMobileProfile } from './mobile-profile';

export interface ListingSummary {
  id: string;
  title: string;
  price: number;
  category: string;
  status: string;
  city?: string | null;
  district?: string | null;
  location?: string | null;
  views: number;
  isFavorite: boolean;
  distance?: string | null;
  image: string;
  createdAt: string;
  seller: {
    id: string;
    name: string;
    avatar?: string | null;
    isVerified: boolean;
  };
}

export interface ListingDetail extends ListingSummary {
  description: string;
  images: string[];
  acceptsOffers: boolean;
  contactPhone?: string | null;
  sellerId: string;
  favoriteCount?: number;
  latitude?: number | null;
  longitude?: number | null;
  seller: {
    id: string;
    name: string;
    avatar?: string | null;
    phone?: string | null;
    bio?: string | null;
    city?: string | null;
    rating: number;
    totalSales: number;
    isVerified: boolean;
    createdAt: string;
  };
}

interface ListResponse {
  items: ListingSummary[];
  hasMore: boolean;
  nextCursor?: string | null;
}

export function formatPrice(price: number): string {
  return `₺${price.toLocaleString('tr-TR')}`;
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes} dk önce`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} saat önce`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} gün önce`;
  return date.toLocaleDateString('tr-TR');
}

export function formatLastActive(lastActiveAt?: string | null, isOnline?: boolean): string {
  if (isOnline) return 'Çevrimiçi';
  if (!lastActiveAt) return 'Son görülme bilinmiyor';
  const diff = Date.now() - new Date(lastActiveAt).getTime();
  if (diff < 60_000) return 'Az önce aktif';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce aktif`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} saat önce aktif`;
  return `${Math.floor(diff / 86_400_000)} gün önce aktif`;
}

export function useListings(params?: {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
  district?: string;
  radiusKm?: number;
  lat?: number;
  lon?: number;
}) {
  return useInfiniteQuery({
    queryKey: ['listings', params],
    queryFn: async ({ pageParam }) => {
      const search = new URLSearchParams();
      if (pageParam) search.set('cursor', pageParam);
      if (params?.category) search.set('category', params.category);
      if (params?.q) search.set('q', params.q);
      if (params?.minPrice) search.set('minPrice', String(params.minPrice));
      if (params?.maxPrice) search.set('maxPrice', String(params.maxPrice));
      if (params?.city) search.set('city', params.city);
      if (params?.district) search.set('district', params.district);
      if (params?.radiusKm) search.set('radiusKm', String(params.radiusKm));
      if (params?.lat != null) search.set('lat', String(params.lat));
      if (params?.lon != null) search.set('lon', String(params.lon));
      search.set('limit', '20');
      return apiFetch<ListResponse>(`/listings?${search}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
    refetchInterval: Platform.OS === 'web' ? 300_000 : false,
    refetchOnWindowFocus: false,
  });
}

export function useListing(id: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => apiFetch<ListingDetail>(`/listings/${id}`),
    enabled: !!id,
    refetchInterval: Platform.OS === 'web' ? 300_000 : false,
    refetchOnWindowFocus: false,
  });
}

export function useMyListings() {
  return useInfiniteQuery({
    queryKey: ['my-listings'],
    queryFn: async ({ pageParam }) => {
      const search = new URLSearchParams();
      if (pageParam) search.set('cursor', pageParam);
      return apiFetch<ListResponse>(`/listings/me?${search}`);
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? last.nextCursor ?? undefined : undefined),
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => apiFetch<ListResponse>(`/listings?q=${encodeURIComponent(q)}&limit=20`),
    enabled: q.length >= 2,
  });
}

export function useFavorites() {
  return useQuery({
    queryKey: ['favorites'],
    queryFn: () => apiFetch<ListResponse>('/favorites'),
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ listingId, isFavorite }: { listingId: string; isFavorite: boolean }) => {
      if (isFavorite) {
        await apiFetch(`/favorites/${listingId}`, { method: 'DELETE' });
      } else {
        await apiFetch(`/favorites/${listingId}`, { method: 'POST' });
      }
    },
    onMutate: async ({ listingId, isFavorite }) => {
      await qc.cancelQueries({ queryKey: ['listing', listingId] });
      const prev = qc.getQueryData<ListingDetail>(['listing', listingId]);
      if (prev) {
        qc.setQueryData(['listing', listingId], {
          ...prev,
          isFavorite: !isFavorite,
          favoriteCount:
            prev.favoriteCount !== undefined
              ? Math.max(0, prev.favoriteCount + (isFavorite ? -1 : 1))
              : prev.favoriteCount,
        });
      }
      return { prev };
    },
    onError: (_err, { listingId }, ctx) => {
      if (ctx?.prev) qc.setQueryData(['listing', listingId], ctx.prev);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['listing'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCreateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      title: string;
      price: number;
      category: string;
      description: string;
      city?: string;
      district?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      contactPhone?: string;
      images: string[];
    }) =>
      apiFetch<ListingDetail>('/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (detail) => {
      qc.setQueryData(['listing', detail.id], detail);
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useUpdateListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      title?: string;
      price?: number;
      category?: string;
      description?: string;
      city?: string;
      district?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      images?: string[];
    }) =>
      apiFetch<ListingDetail>(`/listings/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listing', vars.id] });
    },
  });
}

export function useDeleteListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<{ success: boolean }>(`/listings/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
    },
  });
}

export function useUpdateListingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/listings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      qc.invalidateQueries({ queryKey: ['listing'] });
    },
  });
}

export interface ConversationSummary {
  id: string;
  listingId: string;
  listingTitle: string;
  listingImage?: string | null;
  otherUser: {
    id: string;
    name: string;
    avatar?: string | null;
    lastActiveAt?: string | null;
    isOnline?: boolean;
  };
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  deliveredAt?: string | null;
  createdAt: string;
}

export interface ChatConversationMeta {
  id: string;
  listingId: string;
  listingTitle: string;
  otherUser: ConversationSummary['otherUser'];
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: {
      name?: string;
      bio?: string;
      city?: string;
      district?: string;
      phone?: string;
      avatar?: string;
    }) => {
      if (Platform.OS === 'web') {
        return updateWebProfile(data);
      }
      return updateMobileProfile(data);
    },
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<{ items: ConversationSummary[] }>('/conversations'),
    refetchInterval: Platform.OS === 'web' ? 10_000 : 5_000,
    refetchOnWindowFocus: Platform.OS !== 'web',
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      apiFetch<{ items: Message[]; conversation?: ChatConversationMeta; hasMore: boolean }>(
        `/conversations/${conversationId}/messages`,
      ),
    enabled: !!conversationId,
    refetchInterval: Platform.OS === 'web' ? 10_000 : 3_000,
    refetchOnWindowFocus: Platform.OS !== 'web',
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ conversationId, content }: { conversationId: string; content: string }) =>
      apiFetch<Message>(`/conversations/${conversationId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['messages', vars.conversationId] });
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useStartConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, message }: { listingId: string; message?: string }) =>
      apiFetch<ConversationSummary>('/conversations', {
        method: 'POST',
        body: JSON.stringify({ listingId, message }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useCreateReport() {
  return useMutation({
    mutationFn: (data: {
      listingId?: string;
      reportedUserId?: string;
      reason: string;
      description?: string;
    }) =>
      apiFetch('/reports', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  });
}

export interface OfferSummary {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  amount: number;
  offeredBy: string;
  status: string;
  message?: string | null;
  parentOfferId?: string | null;
  createdAt: string;
  updatedAt: string;
  listingTitle?: string;
  buyer?: { id: string; name: string; avatar?: string | null };
  seller?: { id: string; name: string; avatar?: string | null };
}

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: string | null;
  isRead: boolean;
  createdAt: string;
}

export function useListingOffers(listingId: string) {
  return useQuery({
    queryKey: ['offers', 'listing', listingId],
    queryFn: () =>
      apiFetch<{ items: OfferSummary[]; listingTitle: string }>(`/offers/listing/${listingId}`),
    enabled: !!listingId,
    refetchInterval: Platform.OS === 'web' ? false : 30_000,
  });
}

export function useMyOffers() {
  return useQuery({
    queryKey: ['offers', 'my'],
    queryFn: () => apiFetch<{ items: OfferSummary[] }>('/offers/my'),
    refetchInterval: Platform.OS === 'web' ? false : 30_000,
  });
}

export function useCreateOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listingId: string; amount: number; message?: string }) =>
      apiFetch<OfferSummary>('/offers', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['offers'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useCounterOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, amount, message }: { offerId: string; amount: number; message?: string }) =>
      apiFetch<OfferSummary>(`/offers/${offerId}/counter`, {
        method: 'POST',
        body: JSON.stringify({ amount, message }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useAcceptOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) =>
      apiFetch(`/offers/${offerId}/accept`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useRejectOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) =>
      apiFetch(`/offers/${offerId}/reject`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['offers'] }),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<{ items: AppNotification[] }>('/notifications'),
    refetchInterval: Platform.OS === 'web' ? false : 30_000,
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/notifications/read-all', { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) =>
      apiFetch(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useHeartbeat() {
  return useMutation({
    mutationFn: () => apiFetch('/users/me/heartbeat', { method: 'POST' }),
  });
}

export function useCreateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { revieweeId: string; listingId?: string; rating: number; comment?: string }) =>
      apiFetch('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listing'] });
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUserReviews(userId: string) {
  return useQuery({
    queryKey: ['reviews', userId],
    queryFn: () =>
      apiFetch<{
        items: Array<{
          id: string;
          rating: number;
          comment: string;
          createdAt: string;
          reviewer: { id: string; name: string; avatar?: string | null };
        }>;
      }>(`/reviews/user/${userId}`),
    enabled: !!userId,
  });
}
