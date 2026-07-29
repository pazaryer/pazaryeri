import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';
import { THEME, SPACING } from '@/lib/theme';

export function Screen({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.screen, style]}>{children}</View>;
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Title({ children }: { children: React.ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Btn({
  label,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        variant === 'danger' && styles.btnDanger,
        variant === 'ghost' && styles.btnGhost,
        (disabled || loading || pressed) && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={THEME.text} />
      ) : (
        <Text style={[styles.btnText, variant === 'ghost' && styles.btnGhostText]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Input(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={THEME.textMuted}
      style={[styles.input, props.style]}
    />
  );
}

export function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <Card style={styles.statCard}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </Card>
  );
}

export function Badge({ text, tone = 'default' }: { text: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const bg =
    tone === 'success' ? '#123B2A' :
    tone === 'warning' ? '#3D2A0A' :
    tone === 'danger' ? '#3D1212' :
    THEME.surfaceElevated;
  const color =
    tone === 'success' ? THEME.success :
    tone === 'warning' ? THEME.warning :
    tone === 'danger' ? THEME.danger :
    THEME.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={THEME.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.bg, padding: SPACING.md },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: THEME.border,
  },
  title: { fontSize: 24, fontWeight: '700', color: THEME.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: THEME.textMuted, marginBottom: SPACING.md },
  btn: {
    backgroundColor: THEME.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnDanger: { backgroundColor: THEME.danger },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: THEME.border },
  btnPressed: { opacity: 0.75 },
  btnText: { color: THEME.text, fontWeight: '600', fontSize: 15 },
  btnGhostText: { color: THEME.textMuted },
  input: {
    backgroundColor: THEME.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.border,
    marginBottom: SPACING.sm,
  },
  statCard: { flex: 1, minWidth: '45%' },
  statValue: { fontSize: 28, fontWeight: '800', color: THEME.gold },
  statLabel: { fontSize: 12, color: THEME.textMuted, marginTop: 4 },
  badge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  empty: { padding: SPACING.xl, alignItems: 'center' },
  emptyText: { color: THEME.textMuted },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.bg },
});
