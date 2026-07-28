import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { openPhoneCall, openWhatsApp } from '@/lib/contact';
import { showAlert } from '@/lib/web-alert';

interface ContactActionsProps {
  phone?: string | null;
  listingTitle?: string;
  onMessage: () => void;
  messageLoading?: boolean;
  compact?: boolean;
}

export function ContactActions({
  phone,
  listingTitle,
  onMessage,
  messageLoading,
  compact,
}: ContactActionsProps) {
  const colors = useColors();

  const notify = (title: string, msg: string) => {
    if (Platform.OS === 'web') showAlert(title, msg);
    else Alert.alert(title, msg);
  };

  const handleCall = () => {
    if (!phone) {
      notify('Telefon yok', 'Satıcı telefon numarası eklememiş.');
      return;
    }
    void openPhoneCall(phone);
  };

  const handleWhatsApp = () => {
    if (!phone) {
      notify('Telefon yok', 'Satıcı telefon numarası eklememiş.');
      return;
    }
    const msg = listingTitle
      ? `Merhaba, "${listingTitle}" ilanı hakkında bilgi almak istiyorum.`
      : undefined;
    void openWhatsApp(phone, msg);
  };

  return (
    <View style={[styles.row, compact && styles.rowCompact]}>
      <Pressable
        style={[styles.btn, styles.callBtn, { borderColor: colors.border, backgroundColor: colors.card }]}
        onPress={handleCall}
      >
        <Ionicons name="call" size={18} color="#22C55E" />
        <Text style={[styles.btnText, { color: colors.foreground }]}>Ara</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.waBtn, { borderColor: '#25D366' }]}
        onPress={handleWhatsApp}
      >
        <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
        <Text style={[styles.btnText, { color: '#25D366' }]}>WhatsApp</Text>
      </Pressable>
      <Pressable
        style={[styles.btn, styles.msgBtn, { backgroundColor: colors.primary }]}
        onPress={onMessage}
        disabled={messageLoading}
      >
        <Ionicons name="chatbubble" size={18} color="#FFF" />
        <Text style={[styles.btnText, { color: '#FFF' }]}>Mesaj</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  rowCompact: { gap: 6 },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
  },
  callBtn: {},
  waBtn: { backgroundColor: 'rgba(37, 211, 102, 0.08)' },
  msgBtn: { borderWidth: 0 },
  btnText: { fontSize: 13, fontWeight: '700' },
});
