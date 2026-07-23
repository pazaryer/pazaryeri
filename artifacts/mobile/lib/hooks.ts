import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { apiFetch } from './api';
import { updateWebProfile } from './web-profile';

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
  sellerId: string;
  latitude?: number | null;
  longitude?: number | null;
  seller: {
    id: string;
    name: string;
    avatar?: string | null;
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

export function useListings(params?: {
  category?: string;
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  city?: string;
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
    queryFn: () => apiFetch<ListResponse>(`/search?q=${encodeURIComponent(q)}`),
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
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['listings'] });
      qc.invalidateQueries({ queryKey: ['favorites'] });
      qc.invalidateQueries({ queryKey: ['listing'] });
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
      images: string[];
    }) =>
      apiFetch<ListingDetail>('/listings', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
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
  otherUser: { id: string; name: string; avatar?: string | null };
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
  createdAt: string;
}

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: {
      name?: string;
      bio?: string;
      city?: string;
      district?: string;
    }) => {
      if (Platform.OS === 'web') {
        return updateWebProfile(data);
      }
      return apiFetch('/users/me', {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
  });
}

export function useConversations() {
  return useQuery({
    queryKey: ['conversations'],
    queryFn: () => apiFetch<{ items: ConversationSummary[] }>('/conversations'),
    refetchInterval: Platform.OS === 'web' ? false : 60_000,
    refetchOnWindowFocus: Platform.OS !== 'web',
  });
}

export function useMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', conversationId],
    queryFn: () =>
      apiFetch<{ items: Message[]; hasMore: boolean }>(
        `/conversations/${conversationId}/messages`,
      ),
    enabled: !!conversationId,
    refetchInterval: Platform.OS === 'web' ? false : 15_000,
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
