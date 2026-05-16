import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePathname, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import type { IoniconName } from '../constants/sounds';

const TABS: { path: string; icon: IoniconName; activeIcon: IoniconName }[] = [
  { path: '/sounds', icon: 'volume-medium-outline', activeIcon: 'volume-medium' },
  { path: '/breathe', icon: 'leaf-outline', activeIcon: 'leaf' },
  { path: '/', icon: 'home-outline', activeIcon: 'home' },
  { path: '/stories', icon: 'book-outline', activeIcon: 'book' },
  { path: '/timer', icon: 'timer-outline', activeIcon: 'timer' },
];

export function BottomNav() {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map(tab => {
        const isActive = pathname === tab.path;
        return (
          <TouchableOpacity
            key={tab.path}
            style={styles.tab}
            onPress={() => {
              if (!isActive) router.replace(tab.path as '/');
            }}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Ionicons
              name={isActive ? tab.activeIcon : tab.icon}
              size={24}
              color={isActive ? colors.tabActive : colors.textSecondary}
            />
            {isActive && <View style={styles.dot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.tabActive,
  },
});
