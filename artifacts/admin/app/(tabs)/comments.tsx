import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Btn, Card, Input, Loading, SearchInput } from '@/components/ui';
import { PageShell, Section } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';

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
    <PageShell
      title="Yorumlar"
      subtitle={`${data?.total ?? 0} kayıt · moderasyon`}
    >
      <SearchInput
        value={q}
        onChangeText={setQ}
        placeholder="Yorum içeriğinde ara..."
        onSubmitEditing={() => refetch()}
        returnKeyType="search"
      />

      <View style={styles.toolbar}>
        <Btn
          label={showAdd ? 'İptal' : '+ Admin Yorumu'}
          variant={showAdd ? 'ghost' : 'gold'}
          compact
          onPress={() => setShowAdd(!showAdd)}
        />
      </View>

      {showAdd && (
        <Card style={styles.addBox}>
          <Input value={newListingId} onChangeText={setNewListingId} placeholder="İlan UUID" />
          <Input value={newContent} onChangeText={setNewContent} placeholder="Yorum metni" multiline />
          <Btn label="Gönder" onPress={addComment} />
        </Card>
      )}

      <DataTable
        columns={[
          { key: 'content', title: 'Yorum', flex: 3 },
          { key: 'user', title: 'Kullanıcı', flex: 1 },
          { key: 'listing', title: 'İlan', flex: 1 },
          { key: 'date', title: 'Tarih', width: 100 },
          { key: 'action', title: 'İşlem', width: 70 },
        ]}
        data={data?.items ?? []}
        keyExtractor={(item) => item.id}
        emptyMessage="Yorum bulunamadı"
        renderCell={(item, col) => {
          if (col.key === 'content') return <CellText>{item.content}</CellText>;
          if (col.key === 'user') return <CellText muted>{item.user?.name ?? '—'}</CellText>;
          if (col.key === 'listing') return <CellText muted>{item.listingTitle}</CellText>;
          if (col.key === 'date') {
            return <CellText muted>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</CellText>;
          }
          return <Btn label="Sil" variant="danger" compact onPress={() => deleteComment(item.id)} />;
        }}
      />
    </PageShell>
  );
}

const styles = StyleSheet.create({
  toolbar: { marginBottom: 12 },
  addBox: { marginBottom: 12, gap: 8 },
});
