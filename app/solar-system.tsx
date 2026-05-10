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

const ADD_ITEM_ID = '__pad';
const TOTAL = SOLAR_SOUNDS.length;
const REMAINDER = TOTAL % 3;
const PAD_COUNT = REMAINDER === 0 ? 0 : 3 - REMAINDER;

type GridItem = SolarSoundDef | { id: string; isEmpty: true };

const GRID_DATA: GridItem[] = [
  ...SOLAR_SOUNDS,
  ...Array.from({ length: PAD_COUNT }, (_, i) => ({
    id: `${ADD_ITEM_ID}_${i}`,
    isEmpty: true as const,
  })),
];

export default function SolarSystemScreen() {
  const insets = useSafeAreaInsets();
  const { active, volumes, toggle, setVolume } = useSoundPlayer(SOLAR_SOUNDS);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const renderItem = useCallback(
    ({ item }: { item: GridItem }) => {
      if ('isEmpty' in item && item.isEmpty) {
        return <View style={styles.emptyCell} />;
      }
      const sound = item as SolarSoundDef;
      return (
        <SoundCard
          sound={sound}
          isActive={active[sound.id] ?? false}
          volume={volumes[sound.id] ?? 0.7}
          onToggle={() => toggle(sound.id)}
          onVolumeChange={v => setVolume(sound.id, v)}
          onLongPress={() => setExpandedId(sound.id)}
        />
      );
    },
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
        data={GRID_DATA}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
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
  emptyCell: {
    flex: 1,
    margin: 5,
  },
});
