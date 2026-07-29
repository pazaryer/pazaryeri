import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export type UserBadgeData = {
  emoji: string;
  label: string;
  color?: string;
};

type Props = {
  name: string;
  badge?: UserBadgeData | null;
  nameStyle?: object;
  size?: 'sm' | 'md';
};

/** İsimden önce admin rozeti — mavi tik yerine özelleştirilebilir rozet */
export function UserNameWithBadge({ name, badge, nameStyle, size = 'md' }: Props) {
  if (!badge?.emoji) {
    return <Text style={nameStyle} numberOfLines={1}>{name}</Text>;
  }

  const isSm = size === 'sm';
  return (
    <View style={styles.row}>
      <View style={[styles.badgePill, { borderColor: badge.color ?? '#2E90FA', backgroundColor: `${badge.color ?? '#2E90FA'}18` }]}>
        <Text style={[styles.badgeEmoji, isSm && styles.badgeEmojiSm]}>{badge.emoji}</Text>
        {!isSm && badge.label ? (
          <Text style={[styles.badgeLabel, { color: badge.color ?? '#2E90FA' }]} numberOfLines={1}>
            {badge.label}
          </Text>
        ) : null}
      </View>
      <Text style={[nameStyle, styles.name]} numberOfLines={1}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
  },
  badgeEmoji: { fontSize: 12 },
  badgeEmojiSm: { fontSize: 11 },
  badgeLabel: { fontSize: 10, fontWeight: '700' },
  name: { flexShrink: 1 },
});
