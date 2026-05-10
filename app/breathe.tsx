import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import { BottomNav } from '../components/BottomNav';

export default function BreatheScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        <Text style={styles.label}>BREATHE</Text>
        <Text style={styles.subtitle}>Coming soon</Text>
      </View>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    opacity: 0.5,
  },
});
