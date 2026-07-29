import { Pressable, StyleSheet, Text, View } from 'react-native';
import { THEME, RADIUS } from '@/lib/theme';

export function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} style={styles.starBtn}>
          <Text style={[styles.star, n <= value && styles.starOn]}>{n <= value ? '★' : '☆'}</Text>
        </Pressable>
      ))}
      <Text style={styles.value}>{value}/5</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, marginVertical: 8 },
  starBtn: { padding: 4 },
  star: { fontSize: 28, color: THEME.textMuted },
  starOn: { color: THEME.gold },
  value: { marginLeft: 8, color: THEME.goldLight, fontWeight: '700', fontSize: 14 },
});
