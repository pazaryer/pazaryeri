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
import { THEME, SPACING, RADIUS, SHADOW } from '@/lib/theme';

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
  compact,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'danger' | 'ghost' | 'gold';
  disabled?: boolean;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.btn,
        compact && styles.btnCompact,
        variant === 'danger' && styles.btnDanger,
        variant === 'ghost' && styles.btnGhost,
        variant === 'gold' && styles.btnGold,
        (disabled || loading || pressed) && styles.btnPressed,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={THEME.text} size="small" />
      ) : (
        <Text
          style={[
            styles.btnText,
            variant === 'ghost' && styles.btnGhostText,
            variant === 'gold' && styles.btnGoldText,
            compact && styles.btnTextCompact,
          ]}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

export function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
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

export function SearchInput(props: TextInputProps) {
  return (
    <View style={styles.searchWrap}>
      <Text style={styles.searchIcon}>⌕</Text>
      <TextInput
        {...props}
        placeholderTextColor={THEME.textMuted}
        style={[styles.searchInput, props.style]}
      />
    </View>
  );
}

export function StatCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: number | string;
  color?: string;
  icon?: string;
}) {
  return (
    <View style={styles.statCard}>
      {icon ? <Text style={styles.statIcon}>{icon}</Text> : null}
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function Badge({
  text,
  tone = 'default',
}: {
  text: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'gold';
}) {
  const bg =
    tone === 'success' ? THEME.successBg :
    tone === 'warning' ? THEME.warningBg :
    tone === 'danger' ? THEME.dangerBg :
    tone === 'gold' ? THEME.goldMuted :
    THEME.bgSoft;
  const color =
    tone === 'success' ? THEME.success :
    tone === 'warning' ? THEME.warning :
    tone === 'danger' ? THEME.danger :
    tone === 'gold' ? THEME.gold :
    THEME.textMuted;
  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: `${color}33` }]}>
      <Text style={[styles.badgeText, { color }]}>{text}</Text>
    </View>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>◇</Text>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

export function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator size="large" color={THEME.primary} />
      <Text style={styles.loadingText}>Yükleniyor...</Text>
    </View>
  );
}

export function MenuCard({
  title,
  subtitle,
  icon,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.menuCard, pressed && styles.menuPressed]}>
      <View style={styles.menuIconWrap}>
        <Text style={styles.menuIcon}>{icon}</Text>
      </View>
      <View style={styles.menuText}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSub}>{subtitle}</Text>
      </View>
      <Text style={styles.menuArrow}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: THEME.bg },
  card: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    ...SHADOW.card,
  },
  title: { fontSize: 24, fontWeight: '800', color: THEME.text, marginBottom: SPACING.sm },
  subtitle: { fontSize: 14, color: THEME.textMuted, marginBottom: SPACING.md, lineHeight: 20 },
  btn: {
    backgroundColor: THEME.primary,
    borderRadius: RADIUS.md,
    paddingVertical: 14,
    paddingHorizontal: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.4)',
  },
  btnCompact: { paddingVertical: 10, paddingHorizontal: 14 },
  btnDanger: { backgroundColor: THEME.danger, borderColor: 'rgba(239,68,68,0.4)' },
  btnGhost: { backgroundColor: THEME.bgSoft, borderColor: THEME.border },
  btnGold: { backgroundColor: THEME.goldMuted, borderColor: '#FCD34D' },
  btnPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  btnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
  btnTextCompact: { fontSize: 12 },
  btnGhostText: { color: THEME.textSoft },
  btnGoldText: { color: THEME.goldLight },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: RADIUS.pill,
    borderWidth: 1,
    borderColor: THEME.border,
    backgroundColor: THEME.surface,
  },
  chipActive: {
    backgroundColor: THEME.primaryLight,
    borderColor: THEME.primary,
  },
  chipText: { fontSize: 12, fontWeight: '600', color: THEME.textMuted },
  chipTextActive: { color: THEME.primary },
  input: {
    backgroundColor: THEME.surfaceElevated,
    borderRadius: RADIUS.md,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: THEME.text,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    fontSize: 15,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.borderSoft,
    marginBottom: SPACING.md,
    paddingHorizontal: 14,
  },
  searchIcon: { fontSize: 18, color: THEME.primary, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 14, color: THEME.text, fontSize: 15 },
  statCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: THEME.border,
    ...SHADOW.card,
  },
  statIcon: { fontSize: 18, marginBottom: 6 },
  statValue: { fontSize: 30, fontWeight: '800', color: THEME.primary, letterSpacing: -1 },
  statLabel: { fontSize: 12, color: THEME.textMuted, marginTop: 6, lineHeight: 16 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
  empty: { padding: SPACING.xl, alignItems: 'center', gap: 8 },
  emptyIcon: { fontSize: 28, color: THEME.border },
  emptyText: { color: THEME.textMuted, fontSize: 14 },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: THEME.bg,
    gap: 12,
  },
  loadingText: { color: THEME.textMuted, fontSize: 13 },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: THEME.border,
    gap: SPACING.md,
  },
  menuPressed: { backgroundColor: THEME.surfaceElevated },
  menuIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: THEME.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuIcon: { fontSize: 22 },
  menuText: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: THEME.text },
  menuSub: { fontSize: 12, color: THEME.textMuted, marginTop: 3 },
  menuArrow: { fontSize: 24, color: THEME.textMuted, fontWeight: '300' },
});
