import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { SOLAR_SOUNDS, type SolarSoundDef } from '../constants/solarSounds';
import SoundCard from '../components/SoundCard';
import { SoundModal } from '../components/SoundModal';
import { useSoundPlayer } from '../hooks/useSoundPlayer';

export default function SolarSystemScreen() {
  const insets = useSafeAreaInsets();
  const { active, volumes, toggle, setVolume } = useSoundPlayer(SOLAR_SOUNDS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: SolarSoundDef }) => (
      <SoundCard
        sound={item}
        isActive={active[item.id] ?? false}
        volume={volumes[item.id] ?? 0.7}
        onToggle={() => toggle(item.id)}
        onVolumeChange={v => setVolume(item.id, v)}
        onLongPress={() => setExpandedId(item.id)}
      />
    ),
    [active, volumes, toggle, setVolume],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back-outline" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Solar System</Text>
          <Text style={styles.subtitle}>The gods of Olympus</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={SOLAR_SOUNDS}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.columnWrapper}
        showsVerticalScrollIndicator={false}
      />

      <SoundModal
        sounds={SOLAR_SOUNDS}
        expandedId={expandedId}
        active={active}
        volumes={volumes}
        onToggle={toggle}
        onVolumeChange={setVolume}
        onClose={() => setExpandedId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  backBtn: {
    width: 44,
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 32,
  },
  columnWrapper: {
    justifyContent: 'center',
  },
});
