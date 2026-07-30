import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface ReviewModalProps {
  visible: boolean;
  userName: string;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => Promise<void>;
}

export function ReviewModal({ visible, userName, onClose, onSubmit }: ReviewModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(rating, comment.trim());
      setComment('');
      setRating(5);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  const bottomPad = Math.max(insets.bottom, 16);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              paddingBottom: bottomPad + 12,
            },
          ]}
        >
          <Text style={[styles.title, { color: colors.foreground }]}>Değerlendir</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]}>{userName}</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
                <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={32} color="#FFB800" />
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground },
            ]}
            placeholder="Yorumunuz (isteğe bağlı)"
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={comment}
            onChangeText={setComment}
          />

          <View style={styles.actions}>
            <Pressable style={[styles.btn, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>İptal</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.btnText}>Gönder</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 20, paddingTop: 20, gap: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 14 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
  input: { minHeight: 80, borderWidth: 1, borderRadius: 12, padding: 12, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  btnText: { color: '#FFF', fontWeight: '700' },
});
