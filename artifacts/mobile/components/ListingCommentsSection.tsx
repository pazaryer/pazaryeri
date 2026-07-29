import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { UserAvatar } from '@/components/UserAvatar';
import {
  formatTimeAgo,
  useListingComments,
  useCreateListingComment,
  useDeleteListingComment,
} from '@/lib/hooks';
import { useAuth } from '@/contexts/AuthContext';

interface ListingCommentsSectionProps {
  listingId: string;
  sellerId: string;
}

export function ListingCommentsSection({ listingId, sellerId }: ListingCommentsSectionProps) {
  const colors = useColors();
  const { user, profile } = useAuth();
  const { data, isLoading } = useListingComments(listingId);
  const createComment = useCreateListingComment();
  const deleteComment = useDeleteListingComment();
  const [text, setText] = useState('');

  const comments = data?.items ?? [];

  const handleSubmit = async () => {
    const content = text.trim();
    if (content.length < 2) return;
    if (!user) {
      Alert.alert('Giriş gerekli', 'Yorum yapmak için giriş yapın');
      return;
    }
    await createComment.mutateAsync({ listingId, content });
    setText('');
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>
          İlan Yorumları ({comments.length})
        </Text>
      </View>
      <Text style={[styles.hint, { color: colors.mutedForeground }]}>
        Soru sorun, deneyim paylaşın — tüm yorumlar herkese açıktır.
      </Text>

      {user && (
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Yorumunuzu yazın..."
            placeholderTextColor={colors.mutedForeground}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={1000}
          />
          <Pressable
            style={[styles.sendBtn, { backgroundColor: colors.primary }, !text.trim() && { opacity: 0.5 }]}
            onPress={() => void handleSubmit()}
            disabled={!text.trim() || createComment.isPending}
          >
            {createComment.isPending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Ionicons name="send" size={16} color="#FFF" />
            )}
          </Pressable>
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 12 }} />
      ) : comments.length === 0 ? (
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>Henüz yorum yok. İlk yorumu siz yapın!</Text>
      ) : (
        comments.map((c) => {
          const canDelete = profile?.id === c.user.id || profile?.id === sellerId;
          return (
            <View key={c.id} style={[styles.comment, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <UserAvatar name={c.user.name} avatar={c.user.avatar} size={36} />
              <View style={styles.commentBody}>
                <View style={styles.commentTop}>
                  <Text style={[styles.name, { color: colors.foreground }]}>{c.user.name}</Text>
                  <Text style={[styles.time, { color: colors.mutedForeground }]}>{formatTimeAgo(c.createdAt)}</Text>
                </View>
                <Text style={[styles.content, { color: colors.foreground }]}>{c.content}</Text>
                {canDelete && (
                  <Pressable
                    onPress={() =>
                      deleteComment.mutateAsync({ listingId, commentId: c.id })
                    }
                    hitSlop={8}
                  >
                    <Text style={styles.delete}>Sil</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20, gap: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { fontSize: 18, fontWeight: '700' },
  hint: { fontSize: 13, lineHeight: 18 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    padding: 10,
  },
  input: { flex: 1, fontSize: 14, minHeight: 40, maxHeight: 100 },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 14, fontStyle: 'italic' },
  comment: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, borderWidth: 1 },
  commentBody: { flex: 1, gap: 4 },
  commentTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 14, fontWeight: '700' },
  time: { fontSize: 11 },
  content: { fontSize: 14, lineHeight: 20 },
  delete: { fontSize: 12, color: '#C62828', fontWeight: '600', marginTop: 4 },
});
