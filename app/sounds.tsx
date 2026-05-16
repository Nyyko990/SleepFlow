import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '../constants/colors';
import type { SoundDef } from '../constants/sounds';
import SoundCard from '../components/SoundCard';
import { SoundModal } from '../components/SoundModal';
import { RecordingModal } from '../components/RecordingModal';
import { BottomNav } from '../components/BottomNav';
import { useAudio } from '../context/AudioContext';

const ADD_BUTTON_ID = '__add';

type FilterLabel = 'All' | 'Nature' | 'Personal';
type GridItem = SoundDef | { id: string; isEmpty: true } | { id: '__add' };

const PLANETS = [
  { size: 26, color: '#D4A843', top: 6, right: 6 },
  { size: 15, color: '#4A7CB5', top: 26, right: 38 },
  { size: 19, color: '#6B4FA0', top: 2, right: 28 },
  { size: 11, color: '#3A9E8F', top: 34, right: 10 },
] as const;

function buildGrid(soundDefs: SoundDef[], withAdd: boolean, padPrefix = ''): GridItem[] {
  const base: GridItem[] = withAdd ? [...soundDefs, { id: ADD_BUTTON_ID }] : [...soundDefs];
  const remainder = base.length % 3;
  const padCount = remainder === 0 ? 0 : 3 - remainder;
  const pads: GridItem[] = Array.from({ length: padCount }, (_, i) => ({
    id: `__pad_${padPrefix}_${i}`,
    isEmpty: true as const,
  }));
  return [...base, ...pads];
}

function SolarCard() {
  return (
    <TouchableOpacity
      style={styles.solarCard}
      activeOpacity={0.82}
      onPress={() => router.push('/solar-system')}
    >
      <View style={styles.solarTextBlock}>
        <Text style={styles.solarLabel}>FEATURED BUNDLE</Text>
        <Text style={styles.solarTitle}>Solar System</Text>
        <Text style={styles.solarSubtitle}>Ancient gods of the night sky</Text>
        <View style={styles.solarBadge}>
          <Text style={styles.solarBadgeText}>8 sounds</Text>
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

export default function SoundsScreen() {
  const insets = useSafeAreaInsets();
  const {
    allSounds,
    allActive,
    allVolumes,
    handleToggle,
    handleSetVolume,
    recordings,
    addRecording,
    deleteRecording,
  } = useAudio();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterLabel>('All');

  const natureSounds = useMemo(
    () => allSounds.filter(s => s.category === 'nature' && !s.isUserRecording),
    [allSounds],
  );
  const personalSounds = useMemo(
    () => allSounds.filter(s => s.isUserRecording),
    [allSounds],
  );

  const renderGridItem = useCallback(
    ({ item }: { item: GridItem }) => {
      if ('isEmpty' in item && item.isEmpty) {
        return <View style={styles.emptyCell} />;
      }
      if (item.id === ADD_BUTTON_ID) {
        return (
          <TouchableOpacity
            style={styles.addCard}
            onPress={() => setShowRecordingModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons name="add-outline" size={30} color={colors.textSecondary} />
          </TouchableOpacity>
        );
      }
      const sound = item as SoundDef;
      return (
        <SoundCard
          sound={sound}
          isActive={allActive[sound.id] ?? false}
          volume={allVolumes[sound.id] ?? 0.7}
          onToggle={() => handleToggle(sound.id)}
          onVolumeChange={v => handleSetVolume(sound.id, v)}
          onLongPress={() => setExpandedId(sound.id)}
        />
      );
    },
    [allActive, allVolumes, handleToggle, handleSetVolume],
  );

  // Manual grid renderer for use inside ScrollView (avoids nested VirtualizedList warning)
  const renderManualGrid = useCallback(
    (sounds: SoundDef[], withAdd: boolean, prefix: string) => {
      const items = buildGrid(sounds, withAdd, prefix);
      const rows: GridItem[][] = [];
      for (let i = 0; i < items.length; i += 3) {
        rows.push(items.slice(i, i + 3));
      }
      return (
        <View style={styles.manualGrid}>
          {rows.map((row, ri) => (
            <View key={ri} style={styles.gridRow}>
              {row.map(item => (
                <View key={item.id} style={styles.gridCell}>
                  {renderGridItem({ item })}
                </View>
              ))}
            </View>
          ))}
        </View>
      );
    },
    [renderGridItem],
  );

  const handlePillPress = useCallback((pill: string) => {
    if (pill === 'Space') {
      router.push('/solar-system');
      return;
    }
    if (pill === '+') {
      setActiveFilter('Personal');
      return;
    }
    setActiveFilter(pill as FilterLabel);
  }, []);

  const pills = ['All', 'Nature', 'Space', '+'] as const;

  const isPillActive = (pill: string): boolean => {
    if (pill === 'Space') return false;
    if (pill === '+') return activeFilter === 'Personal';
    return activeFilter === pill;
  };

  // For the single-filter FlatList views (Nature / Personal)
  const singleFilterData = useMemo(() => {
    if (activeFilter === 'Nature') return buildGrid(natureSounds, false, 'n');
    if (activeFilter === 'Personal') return buildGrid(personalSounds, true, 'p');
    return [];
  }, [activeFilter, natureSounds, personalSounds]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <Text style={styles.brand}>SLEEPFLOW</Text>
      </View>
      <Text style={styles.heading}>Sound Mixer</Text>

      {/* Pills: All | Nature | Space | + */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
      >
        {pills.map(pill => {
          const active = isPillActive(pill);
          return (
            <TouchableOpacity
              key={pill}
              style={[styles.pill, active && styles.pillActive]}
              onPress={() => handlePillPress(pill)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, active && styles.pillTextActive]}>{pill}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* All tab — sectioned ScrollView */}
      {activeFilter === 'All' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.allTabContent}
        >
          <Text style={styles.sectionLabel}>NATURE</Text>
          {renderManualGrid(natureSounds, false, 'n')}

          <Text style={styles.sectionLabel}>SOLAR SYSTEM</Text>
          <SolarCard />

          <Text style={styles.sectionLabel}>PERSONAL</Text>
          {renderManualGrid(personalSounds, true, 'p')}
        </ScrollView>
      )}

      {/* Nature / Personal single-section FlatList */}
      {activeFilter !== 'All' && (
        <FlatList
          data={singleFilterData}
          keyExtractor={item => item.id}
          numColumns={3}
          renderItem={renderGridItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          ListHeaderComponent={
            <Text style={styles.sectionLabel}>
              {activeFilter === 'Nature' ? 'NATURE SOUNDS' : 'PERSONAL'}
            </Text>
          }
        />
      )}

      <View style={styles.timerArea} />
      <BottomNav />

      <SoundModal
        sounds={allSounds}
        expandedId={expandedId}
        active={allActive}
        volumes={allVolumes}
        onToggle={handleToggle}
        onVolumeChange={handleSetVolume}
        onClose={() => setExpandedId(null)}
        onDelete={deleteRecording}
      />

      <RecordingModal
        visible={showRecordingModal}
        existingCount={recordings.length}
        onSave={addRecording}
        onClose={() => setShowRecordingModal(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 2,
  },
  brand: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.7,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingBottom: 12,
    opacity: 0.9,
  },
  pillsScroll: {
    flexGrow: 0,
    marginBottom: 10,
  },
  pillsRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  pillActive: {
    backgroundColor: colors.pillActive,
    borderColor: colors.accentBlue,
  },
  pillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  pillTextActive: {
    color: colors.textPrimary,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 8,
  },
  allTabContent: {
    paddingBottom: 16,
  },
  manualGrid: {
    paddingHorizontal: 10,
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 16,
  },
  emptyCell: {
    flex: 1,
    margin: 5,
  },
  addCard: {
    flex: 1,
    margin: 5,
    paddingVertical: 28,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerArea: {
    height: 4,
  },
  solarCard: {
    marginHorizontal: 10,
    marginBottom: 4,
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
  solarTextBlock: {
    flex: 1,
  },
  solarLabel: {
    color: colors.accentBlue,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  solarTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 3,
  },
  solarSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    marginBottom: 10,
  },
  solarBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    backgroundColor: colors.accentPurple,
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  solarBadgeText: {
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
