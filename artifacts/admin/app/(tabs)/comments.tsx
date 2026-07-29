import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, FlatList, StyleSheet, Text } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Btn, Card, EmptyState, Input, Loading, Screen, Title } from '@/components/ui';
import { THEME, SPACING } from '@/lib/theme';

interface CommentRow {
  id: string;
  content: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  user: { name: string; email: string | null };
}

export default function CommentsScreen() {
  const [q, setQ] = useState('');
  const [newListingId, setNewListingId] = useState('');
  const [newContent, setNewContent] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-comments', q],
    queryFn: () => {
      const params = new URLSearchParams({ limit: '50' });
      if (q) params.set('q', q);
      return adminFetch<{ items: CommentRow[]; total: number }>(`/admin/comments?${params}`);
    },
  });

  async function deleteComment(id: string) {
    Alert.alert('Yorumu Sil', 'Bu yorum silinsin mi?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: async () => {
          await adminFetch(`/admin/comments/${id}`, { method: 'DELETE' });
          refetch();
        },
      },
    ]);
  }

  async function addComment() {
    if (!newListingId.trim() || !newContent.trim()) {
      Alert.alert('Hata', 'İlan ID ve yorum metni gerekli');
      return;
    }
    await adminFetch('/admin/comments', {
      method: 'POST',
      body: JSON.stringify({ listingId: newListingId.trim(), content: newContent.trim() }),
    });
    setNewContent('');
    setShowAdd(false);
    refetch();
  }

  if (isLoading) return <Loading />;

  return (
    <Screen style={{ paddingBottom: 0 }}>
      <Title>Yorumlar ({data?.total ?? 0})</Title>
      <Input value={q} onChangeText={setQ} placeholder="Yorum içeriğinde ara..." onSubmitEditing={() => refetch()} />
      <Btn label={showAdd ? 'İptal' : '+ Admin Yorumu Yaz'} variant="ghost" onPress={() => setShowAdd(!showAdd)} />
      {showAdd && (
        <Card style={styles.addBox}>
          <Input value={newListingId} onChangeText={setNewListingId} placeholder="İlan UUID" />
          <Input value={newContent} onChangeText={setNewContent} placeholder="Yorum metni" multiline />
          <Btn label="Gönder" onPress={addComment} />
        </Card>
      )}
      <FlatList
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<EmptyState message="Yorum bulunamadı" />}
        renderItem={({ item }) => (
          <Card style={styles.row}>
            <Text style={styles.content}>{item.content}</Text>
            <Text style={styles.sub}>
              {item.user?.name ?? '—'} · {item.listingTitle}
            </Text>
            <Text style={styles.sub}>{new Date(item.createdAt).toLocaleString('tr-TR')}</Text>
            <Btn label="Sil" variant="danger" onPress={() => deleteComment(item.id)} />
          </Card>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  addBox: { marginBottom: SPACING.md, gap: SPACING.sm },
  row: { marginBottom: SPACING.sm, gap: SPACING.sm },
  content: { color: THEME.text, fontSize: 14 },
  sub: { color: THEME.textMuted, fontSize: 11 },
});
