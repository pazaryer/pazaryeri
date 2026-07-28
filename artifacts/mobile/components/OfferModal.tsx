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
import { useColors } from '@/hooks/useColors';
import { formatPrice } from '@/lib/hooks';

interface OfferModalProps {
  visible: boolean;
  listingTitle: string;
  listingPrice: number;
  onClose: () => void;
  onSubmit: (amount: number, message?: string) => Promise<void>;
  title?: string;
}

export function OfferModal({
  visible,
  listingTitle,
  listingPrice,
  onClose,
  onSubmit,
  title = 'Teklif Ver',
}: OfferModalProps) {
  const colors = useColors();
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const value = parseInt(amount.replace(/\D/g, ''), 10);
    if (!value || value < 1) return;
    setLoading(true);
    try {
      await onSubmit(value, message.trim() || undefined);
      setAmount('');
      setMessage('');
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          <Text style={[styles.sub, { color: colors.mutedForeground }]} numberOfLines={2}>
            {listingTitle} · İlan fiyatı: {formatPrice(listingPrice)}
          </Text>

          <Text style={[styles.label, { color: colors.foreground }]}>Teklif Tutarı (₺)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="0"
            placeholderTextColor={colors.mutedForeground}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <Text style={[styles.label, { color: colors.foreground }]}>Mesaj (isteğe bağlı)</Text>
          <TextInput
            style={[styles.input, styles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.foreground }]}
            placeholder="Teklifinizle ilgili not..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <View style={styles.actions}>
            <Pressable style={[styles.btn, styles.cancel, { borderColor: colors.border }]} onPress={onClose}>
              <Text style={{ color: colors.foreground, fontWeight: '600' }}>İptal</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, { backgroundColor: colors.primary }, loading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={loading || !amount.trim()}
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
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, gap: 8 },
  title: { fontSize: 20, fontWeight: '800' },
  sub: { fontSize: 14, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  input: { height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, fontSize: 16 },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 12 },
  btn: { flex: 1, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cancel: { borderWidth: 1 },
  btnText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
