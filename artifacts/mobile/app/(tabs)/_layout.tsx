import React from 'react';
import { Platform, StyleSheet, useColorScheme, View, Pressable } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Feather, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs, useRouter } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { SymbolView } from 'expo-symbols';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function NativeTabLayout() {
  const colors = useColors();
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Ana Sayfa</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="explore">
        <Icon sf={{ default: 'safari', selected: 'safari.fill' }} />
        <Label>Keşfet</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="post">
        <Icon sf="plus.circle.fill" />
        <Label>İlan Ver</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="messages">
        <Icon sf={{ default: 'message', selected: 'message.fill' }} />
        <Label>Mesajlar</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: 'person', selected: 'person.fill' }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function CustomPostTabButton({ children, onPress }: any) {
  const colors = useColors();
  return (
    <Pressable
      style={{
        ...StyleSheet.absoluteFillObject,
        top: -20,
        justifyContent: 'center',
        alignItems: 'center',
      }}
      onPress={onPress}
    >
      <View style={{
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 5,
      }}>
        <Ionicons name="add" size={32} color="#FFF" />
      </View>
    </Pressable>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isIOS = Platform.OS === 'ios';
  const isWeb = Platform.OS === 'web';
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: isIOS ? 'transparent' : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
          paddingBottom: isWeb ? 34 : insets.bottom,
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={80}
              tint={isDark ? 'dark' : 'light'}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              {isIOS 
                ? <SymbolView name={focused ? "house.fill" : "house"} tintColor={color} size={22} />
                : <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
              }
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              {isIOS 
                ? <SymbolView name={focused ? "safari.fill" : "safari"} tintColor={color} size={22} />
                : <Ionicons name={focused ? "compass" : "compass-outline"} size={22} color={color} />
              }
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          title: 'İlan Ver',
          tabBarIcon: () => null,
          tabBarButton: (props) => <CustomPostTabButton {...props} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              {isIOS 
                ? <SymbolView name={focused ? "message.fill" : "message"} tintColor={color} size={22} />
                : <Ionicons name={focused ? "chatbubble" : "chatbubble-outline"} size={22} color={color} />
              }
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ alignItems: 'center', gap: 4 }}>
              {isIOS 
                ? <SymbolView name={focused ? "person.fill" : "person"} tintColor={color} size={22} />
                : <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
              }
              {focused && (
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: colors.primary }} />
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}