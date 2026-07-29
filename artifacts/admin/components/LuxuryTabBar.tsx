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
  { name: 'more', label: 'Ayarlar', icon: 'settings-outline', iconActive: 'settings' },
];

export function LuxuryTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 10);

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={styles.bar}>
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
                  color={focused ? THEME.primary : THEME.textMuted}
                />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]} numberOfLines={1}>
                {tab.label}
              </Text>
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
    backgroundColor: THEME.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: THEME.border,
    paddingVertical: 8,
    paddingHorizontal: 4,
    ...SHADOW.tab,
    ...Platform.select({
      android: { elevation: 12 },
    }),
  },
  item: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
  },
  itemPressed: { opacity: 0.85 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  iconWrapActive: {
    backgroundColor: THEME.primaryLight,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    color: THEME.textMuted,
    letterSpacing: 0.2,
  },
  labelActive: {
    color: THEME.primary,
    fontWeight: '700',
  },
});
