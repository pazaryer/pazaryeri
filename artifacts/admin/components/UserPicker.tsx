import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { adminFetch } from '@/lib/api';
import { Input } from './ui';
import { THEME, SPACING, RADIUS } from '@/lib/theme';

type UserOption = { id: string; name: string; email: string | null };

export function UserPicker({
  label,
  value,
  onSelect,
  placeholder = 'Kullanıcı ara...',
}: {
  label: string;
  value: UserOption | null;
  onSelect: (user: UserOption | null) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ['admin-user-picker', q],
    queryFn: () => adminFetch<{ items: UserOption[] }>(`/admin/users?q=${encodeURIComponent(q)}&limit=8`),
    enabled: open && q.length >= 2,
  });

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      {value ? (
        <View style={styles.selected}>
          <View style={styles.selectedText}>
            <Text style={styles.selectedName}>{value.name}</Text>
            <Text style={styles.selectedEmail}>{value.email ?? '—'}</Text>
          </View>
          <Pressable onPress={() => onSelect(null)}>
            <Text style={styles.clear}>✕</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <Input
            value={q}
            onChangeText={(t) => {
              setQ(t);
              setOpen(true);
            }}
            placeholder={placeholder}
            onFocus={() => setOpen(true)}
          />
          {open && (data?.items?.length ?? 0) > 0 && (
            <View style={styles.dropdown}>
              {data!.items.map((u) => (
                <Pressable
                  key={u.id}
                  style={styles.option}
                  onPress={() => {
                    onSelect(u);
                    setOpen(false);
                    setQ('');
                  }}
                >
                  <Text style={styles.optionName}>{u.name}</Text>
                  <Text style={styles.optionEmail}>{u.email ?? '—'}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: SPACING.sm },
  label: { fontSize: 11, color: THEME.gold, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase' },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.surfaceElevated,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  selectedText: { flex: 1 },
  selectedName: { color: THEME.text, fontWeight: '700', fontSize: 15 },
  selectedEmail: { color: THEME.textMuted, fontSize: 12, marginTop: 2 },
  clear: { color: THEME.danger, fontSize: 18, padding: 4 },
  dropdown: {
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: THEME.border,
    marginTop: 4,
    overflow: 'hidden',
  },
  option: { padding: SPACING.md, borderBottomWidth: 1, borderBottomColor: THEME.borderSoft },
  optionName: { color: THEME.text, fontWeight: '600' },
  optionEmail: { color: THEME.textMuted, fontSize: 11, marginTop: 2 },
});
