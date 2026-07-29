import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Btn, Card, Chip, Input, Loading, SearchInput } from '@/components/ui';
import { PageShell, Section, FilterRow } from '@/components/PageShell';
import { DataTable, CellText } from '@/components/DataTable';
import { UserPicker } from '@/components/UserPicker';
import { StarRating } from '@/components/StarRating';
import { SPACING } from '@/lib/theme';

interface CommentRow {
  id: string;
  content: string;
  createdAt: string;
  listingId: string;
  listingTitle: string;
  user: { name: string; email: string | null };
}

type UserOption = { id: string; name: string; email: string | null };

export default function CommentsScreen() {
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'comment' | 'review'>('comment');
  const [showAdd, setShowAdd] = useState(false);
  const [listingId, setListingId] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState<UserOption | null>(null);
  const [reviewer, setReviewer] = useState<UserOption | null>(null);
  const [reviewee, setReviewee] = useState<UserOption | null>(null);
  const [rating, setRating] = useState(5);
  const [busy, setBusy] = useState(false);

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

  async function submit() {
    setBusy(true);
    try {
      if (mode === 'comment') {
        if (!listingId.trim() || !content.trim()) {
          Alert.alert('Hata', 'İlan ID ve yorum metni gerekli');
          return;
        }
        await adminFetch('/admin/comments', {
          method: 'POST',
          body: JSON.stringify({
            listingId: listingId.trim(),
            content: content.trim(),
            userId: author?.id,
          }),
        });
      } else {
        if (!reviewer || !reviewee) {
          Alert.alert('Hata', 'Değerlendiren ve satıcı seçin');
          return;
        }
        await adminFetch('/admin/reviews', {
          method: 'POST',
          body: JSON.stringify({
            reviewerId: reviewer.id,
            revieweeId: reviewee.id,
            listingId: listingId.trim() || undefined,
            rating,
            comment: content.trim(),
          }),
        });
      }
      await adminFetch('/admin/publish', { method: 'POST' });
      setContent('');
      setListingId('');
      setAuthor(null);
      setReviewer(null);
      setReviewee(null);
      setShowAdd(false);
      refetch();
      Alert.alert('Yayınlandı', 'Yorum/değerlendirme kaydedildi ve yayınlandı.');
    } catch (e) {
      Alert.alert('Hata', e instanceof Error ? e.message : 'İşlem başarısız');
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <Loading />;

  return (
    <PageShell title="Yorumlar & Puanlar" subtitle={`${data?.total ?? 0} kayıt · moderasyon`}>
      <SearchInput
        value={q}
        onChangeText={setQ}
        placeholder="Yorum içeriğinde ara..."
        onSubmitEditing={() => refetch()}
        returnKeyType="search"
      />

      <View style={styles.toolbar}>
        <Btn
          label={showAdd ? 'Kapat' : '+ Yeni Ekle'}
          variant={showAdd ? 'ghost' : 'gold'}
          compact
          onPress={() => setShowAdd(!showAdd)}
        />
      </View>

      {showAdd && (
        <Card style={styles.addBox}>
          <FilterRow>
            <Chip label="İlan Yorumu" active={mode === 'comment'} onPress={() => setMode('comment')} />
            <Chip label="Satıcı Puanı" active={mode === 'review'} onPress={() => setMode('review')} />
          </FilterRow>

          <Input
            value={listingId}
            onChangeText={setListingId}
            placeholder="İlan UUID (puan için opsiyonel)"
            autoCapitalize="none"
          />

          {mode === 'comment' ? (
            <UserPicker
              label="Kim adına? (boş = admin)"
              value={author}
              onSelect={setAuthor}
              placeholder="Kullanıcı adı ara..."
            />
          ) : (
            <>
              <UserPicker label="Değerlendiren (alıcı)" value={reviewer} onSelect={setReviewer} />
              <UserPicker label="Satıcı (puan alan)" value={reviewee} onSelect={setReviewee} />
              <Text style={styles.ratingLabel}>Puan</Text>
              <StarRating value={rating} onChange={setRating} />
            </>
          )}

          <Input
            value={content}
            onChangeText={setContent}
            placeholder={mode === 'comment' ? 'Yorum metni' : 'Değerlendirme yorumu'}
            multiline
          />
          <Btn label="Kaydet ve Yayınla" variant="gold" onPress={submit} loading={busy} />
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
  addBox: { marginBottom: 16, gap: 8 },
  ratingLabel: { fontSize: 11, color: '#D4AF37', fontWeight: '700', textTransform: 'uppercase' },
});
