import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
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
import { SOUNDS, type SoundDef } from '../constants/sounds';
import SoundCard from '../components/SoundCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { SoundModal } from '../components/SoundModal';
import { RecordingModal } from '../components/RecordingModal';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { BottomNav } from '../components/BottomNav';
import { useSoundPlayer } from '../hooks/useSoundPlayer';
import { useRecordingPlayer } from '../hooks/useRecordingPlayer';

const ADD_BUTTON_ID = '__add';
const FILTER_LABELS = ['All', 'Nature', 'Space', 'Personal'] as const;
type FilterLabel = (typeof FILTER_LABELS)[number];

type GridItem = SoundDef | { id: string; isEmpty: true } | { id: '__add' };

function buildGridData(soundDefs: SoundDef[]): GridItem[] {
  const withAdd = [...soundDefs, { id: ADD_BUTTON_ID } as GridItem];
  const remainder = withAdd.length % 3;
  const padCount = remainder === 0 ? 0 : 3 - remainder;
  const pads: GridItem[] = Array.from({ length: padCount }, (_, i) => ({
    id: `__pad_${i}`,
    isEmpty: true as const,
  }));
  return [...withAdd, ...pads];
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { active, volumes, toggle, setVolume, isReady } = useSoundPlayer(SOUNDS);
  const {
    soundDefs: recSoundDefs,
    recordings,
    active: recActive,
    volumes: recVolumes,
    toggle: recToggle,
    setVolume: recSetVolume,
    addRecording,
    deleteRecording,
  } = useRecordingPlayer();

  // Loading screen fade-out
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    if (isReady) {
      Animated.timing(loadingOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => setShowLoading(false));
    }
  }, [isReady, loadingOpacity]);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showRecordingModal, setShowRecordingModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterLabel>('All');

  const allSounds: SoundDef[] = useMemo(
    () => [...SOUNDS, ...recSoundDefs],
    [recSoundDefs],
  );

  const filteredSounds: SoundDef[] = useMemo(() => {
    switch (activeFilter) {
      case 'Nature':
        return allSounds.filter(s => !s.isUserRecording);
      case 'Personal':
        return allSounds.filter(s => s.isUserRecording);
      default:
        return allSounds;
    }
  }, [allSounds, activeFilter]);

  const allActive = useMemo(() => ({ ...active, ...recActive }), [active, recActive]);
  const allVolumes = useMemo(() => ({ ...volumes, ...recVolumes }), [volumes, recVolumes]);

  const handleToggle = useCallback(
    (id: string) => {
      if (recActive[id] !== undefined) recToggle(id);
      else toggle(id);
    },
    [active, recActive, toggle, recToggle],
  );

  const handleSetVolume = useCallback(
    (id: string, v: number) => {
      if (recVolumes[id] !== undefined) recSetVolume(id, v);
      else setVolume(id, v);
    },
    [recVolumes, recSetVolume, setVolume],
  );

  const handlePillPress = useCallback((label: string) => {
    if (label === 'Space') {
      router.push('/solar-system');
      return;
    }
    setActiveFilter(label as FilterLabel);
  }, []);

  const gridData = useMemo(() => buildGridData(filteredSounds), [filteredSounds]);

  const renderItem = useCallback(
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

  const ListHeader = useMemo(
    () => (
      <>
        <FeaturedBanner />
        <Text style={styles.sectionLabel}>YOUR SOUNDS</Text>
      </>
    ),
    [],
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Brand + header row */}
      <View style={styles.topBar}>
        <Text style={styles.brand}>SLEEPFLOW</Text>
        <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7} hitSlop={8}>
          <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
      <Text style={styles.greeting}>Good night</Text>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.pillsRow}
        style={styles.pillsScroll}
      >
        {FILTER_LABELS.map(label => {
          const isActive = activeFilter === label && label !== 'Space';
          return (
            <TouchableOpacity
              key={label}
              style={[styles.pill, isActive && styles.pillActive]}
              onPress={() => handlePillPress(label)}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <FlatList
        data={gridData}
        keyExtractor={item => item.id}
        numColumns={3}
        renderItem={renderItem}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        ListHeaderComponent={ListHeader}
      />

      {/* Phase 2: Sleep Timer reserved area */}
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

      {showLoading && <LoadingScreen opacity={loadingOpacity} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greeting: {
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
    paddingTop: 4,
    paddingBottom: 8,
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 4,
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
});
