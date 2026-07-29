import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { THEME, RADIUS, SHADOW } from '@/lib/theme';

type TabConfig = {
  name: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
};

const TABS: TabConfig[] = [
  { name: 'index', label: 'Panel', icon: 'grid-outline', iconActive: 'grid' },
  { name: 'users', label: 'Kullanıcı', icon: 'people-outline', iconActive: 'people' },
  { name: 'listings', label: 'İlan', icon: 'pricetags-outline', iconActive: 'pricetags' },
  { name: 'comments', label: 'Yorum', icon: 'chatbubbles-outline', iconActive: 'chatbubbles' },
  { name: 'more', label: 'Diğer', icon: 'diamond-outline', iconActive: 'diamond' },
];

export function LuxuryTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
        <View style={styles.goldLine} />
        {TABS.map((tab) => {
          const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
          if (routeIndex < 0) return null;
          const focused = state.index === routeIndex;
          const route = state.routes[routeIndex]!;

          return (
            <Pressable
              key={tab.name}
              onPress={() => navigation.navigate(route.name)}
              style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
            >
              <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
                <Ionicons
                  name={focused ? tab.iconActive : tab.icon}
                  size={20}
                  color={focused ? THEME.gold : THEME.textMuted}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
              {focused && <View style={styles.activeDot} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  bar: {
    flexDirection: 'row',
    backgroundColor: THEME.surfaceGlass,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    overflow: 'hidden',
    ...SHADOW.tab,
    ...Platform.select({
      android: { elevation: 20 },
    }),
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: 24,
    right: 24,
    height: 1,
    backgroundColor: 'rgba(212, 175, 55, 0.35)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  itemPressed: { opacity: 0.8 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: THEME.goldMuted,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.35)',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
    letterSpacing: 0.3,
  },
  labelActive: {
    color: THEME.goldLight,
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: THEME.gold,
    marginTop: -2,
  },
});
