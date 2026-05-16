import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { colors } from '../constants/colors';

const PLANETS = [
  { size: 26, color: '#D4A843', top: 6, right: 6 },
  { size: 15, color: '#4A7CB5', top: 26, right: 38 },
  { size: 19, color: '#6B4FA0', top: 2, right: 28 },
  { size: 11, color: '#3A9E8F', top: 34, right: 10 },
] as const;

export function FeaturedBanner({ bundleWidth }: { bundleWidth?: number }) {
  return (
    <TouchableOpacity
      style={[styles.banner, bundleWidth ? { width: bundleWidth, marginHorizontal: 0 } : {}]}
      activeOpacity={0.82}
      onPress={() => router.push('/solar-system')}
    >
      <View style={styles.textBlock}>
        <Text style={styles.label}>FEATURED BUNDLE</Text>
        <Text style={styles.title}>Solar System</Text>
        <Text style={styles.subtitle}>Ancient gods of the night sky</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>8 sounds</Text>
        </View>
      </View>

      <View style={styles.planetCluster}>
        {PLANETS.map((p, i) => (
          <View
            key={i}
            style={[
              styles.planet,
              {
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                backgroundColor: p.color,
                top: p.top,
                right: p.right,
              },
            ]}
          />
        ))}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 10,
    marginBottom: 10,
    borderRadius: 18,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentPurple,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: colors.accentPurple,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  textBlock: {
    flex: 1,
  },
  label: {
    color: colors.accentBlue,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 10,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: colors.accentPurple,
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '500',
  },
  planetCluster: {
    width: 72,
    height: 56,
    position: 'relative',
    marginLeft: 8,
  },
  planet: {
    position: 'absolute',
    opacity: 0.9,
  },
});
