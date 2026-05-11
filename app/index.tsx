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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../constants/colors';
import { SOLAR_SOUNDS } from '../constants/solarSounds';
import type { SoundDef } from '../constants/sounds';
import SoundCard from '../components/SoundCard';
import { LoadingScreen } from '../components/LoadingScreen';
import { SoundModal } from '../components/SoundModal';
import { RecordingModal } from '../components/RecordingModal';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { BottomNav } from '../components/BottomNav';
import { useSoundPlayer } from '../hooks/useSoundPlayer';
import { useAudio } from '../context/AudioContext';

const ADD_BUTTON_ID = '__add';
const FAVORITES_KEY = 'favorite_sounds';

const FILTER_LABELS = ['All', 'Nature', 'Space', 'Personal'] as const;
type FilterLabel = (typeof FILTER_LABELS)[number];

type GridItem = SoundDef | { id: string; isEmpty: true } | { id: '__add' };

const DISCOVER_CARDS = [
  {
    icon: 'leaf-outline' as const,
    title: 'Breathing',
    subtitle: '4 techniques to sleep faster',
    path: '/breathe',
  },
  {
    icon: 'book-outline' as const,
    title: 'Sleep Stories',
    subtitle: 'Let your mind drift away',
    path: '/stories',
  },
  {
    icon: 'planet-outline' as const,
    title: 'Solar System',
    subtitle: 'Ancient gods of the night sky',
    path: '/solar-system',
  },
];

function buildGridData(soundDefs: SoundDef[], includeAdd: boolean): GridItem[] {
  const withAdd: GridItem[] = includeAdd
    ? [...soundDefs, { id: ADD_BUTTON_ID }]
    : [...soundDefs];
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
  const {
    allSounds,
    allActive,
    allVolumes,
    handleToggle,
    handleSetVolume,
    isReady,
    recordings,
    addRecording,
    deleteRecording,
  } = useAudio();

  // Solar sounds player — all file:null, no audio loaded, immediately ready
  const { active: solarActive, volumes: solarVolumes, toggle: solarToggle, setVolume: solarSetVolume } =
    useSoundPlayer(SOLAR_SOUNDS);

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
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(FAVORITES_KEY).then(v => {
      if (v) setFavorites(JSON.parse(v) as string[]);
    });
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const handlePillPress = useCallback((label: string) => {
    setActiveFilter(label as FilterLabel);
  }, []);

  // Determine which sounds/controls to show based on active filter
  const isSpaceFilter = activeFilter === 'Space';
  const isAllFilter = activeFilter === 'All';

  const currentActive = isSpaceFilter ? solarActive : allActive;
  const currentVolumes = isSpaceFilter ? solarVolumes : allVolumes;
  const currentToggle = isSpaceFilter ? solarToggle : handleToggle;
  const currentSetVolume = isSpaceFilter ? solarSetVolume : handleSetVolume;

  const gridSounds: SoundDef[] = useMemo(() => {
    switch (activeFilter) {
      case 'Nature':
        return allSounds.filter(s => s.category === 'nature');
      case 'Personal':
        return allSounds.filter(s => s.isUserRecording);
      case 'Space':
        return SOLAR_SOUNDS;
      default:
        return allSounds;
    }
  }, [activeFilter, allSounds]);

  const gridData = useMemo(
    () => buildGridData(gridSounds, !isSpaceFilter),
    [gridSounds, isSpaceFilter],
  );

  const favoriteSounds = useMemo(
    () => allSounds.filter(s => favorites.includes(s.id)),
    [allSounds, favorites],
  );

  // Modal sound pool — use solar sounds when Space filter is active
  const modalSounds = isSpaceFilter ? SOLAR_SOUNDS : allSounds;

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
          isActive={currentActive[sound.id] ?? false}
          volume={currentVolumes[sound.id] ?? 0.7}
          onToggle={() => currentToggle(sound.id)}
          onVolumeChange={v => currentSetVolume(sound.id, v)}
          onLongPress={() => setExpandedId(sound.id)}
          isFavorite={!isSpaceFilter ? favorites.includes(sound.id) : undefined}
          onFavoriteToggle={!isSpaceFilter ? () => toggleFavorite(sound.id) : undefined}
        />
      );
    },
    [
      currentActive,
      currentVolumes,
      currentToggle,
      currentSetVolume,
      isSpaceFilter,
      favorites,
      toggleFavorite,
    ],
  );

  const sectionLabel = useMemo(() => {
    switch (activeFilter) {
      case 'Nature': return 'NATURE';
      case 'Space': return 'SOLAR SYSTEM';
      case 'Personal': return 'PERSONAL';
      default: return 'ALL SOUNDS';
    }
  }, [activeFilter]);

  const ListHeader = useMemo(
    () => (
      <>
        {isAllFilter && <FeaturedBanner />}

        {isAllFilter && (
          <>
            <Text style={styles.sectionLabel}>FAVORITES</Text>
            {favoriteSounds.length === 0 ? (
              <Text style={styles.favEmptyText}>Hold any sound to favorite it ♡</Text>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.favRow}
              >
                {favoriteSounds.map(sound => (
                  <TouchableOpacity
                    key={sound.id}
                    style={[styles.favCard, (allActive[sound.id] ?? false) && styles.favCardActive]}
                    onPress={() => handleToggle(sound.id)}
                    onLongPress={() => setExpandedId(sound.id)}
                    delayLongPress={400}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={sound.icon}
                      size={22}
                      color={(allActive[sound.id] ?? false) ? colors.accentBlue : colors.textSecondary}
                    />
                    <Text style={[styles.favCardName, (allActive[sound.id] ?? false) && styles.favCardNameActive]}>
                      {sound.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </>
        )}

        <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      </>
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isAllFilter, favoriteSounds, allActive, sectionLabel, handleToggle],
  );

  const ListFooter = useMemo(() => {
    if (!isAllFilter) return null;
    return (
      <View style={styles.discoverSection}>
        <Text style={styles.sectionLabel}>DISCOVER</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoverRow}
        >
          {DISCOVER_CARDS.map(card => (
            <TouchableOpacity
              key={card.path}
              style={styles.discoverCard}
              onPress={() => router.push(card.path as '/')}
              activeOpacity={0.8}
            >
              <View style={styles.discoverIconWrap}>
                <Ionicons name={card.icon} size={22} color={colors.accentBlue} />
              </View>
              <View style={styles.discoverText}>
                <Text style={styles.discoverTitle}>{card.title}</Text>
                <Text style={styles.discoverSubtitle}>{card.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }, [isAllFilter]);

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
          const isActive = activeFilter === label;
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
        ListFooterComponent={ListFooter}
      />

      {/* Phase 2: Sleep Timer reserved area */}
      <View style={styles.timerArea} />

      <BottomNav />

      <SoundModal
        sounds={modalSounds}
        expandedId={expandedId}
        active={isSpaceFilter ? solarActive : allActive}
        volumes={isSpaceFilter ? solarVolumes : allVolumes}
        onToggle={isSpaceFilter ? solarToggle : handleToggle}
        onVolumeChange={isSpaceFilter ? solarSetVolume : handleSetVolume}
        onClose={() => setExpandedId(null)}
        onDelete={isSpaceFilter ? undefined : deleteRecording}
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
  favEmptyText: {
    color: colors.textSecondary,
    fontSize: 12,
    opacity: 0.4,
    paddingHorizontal: 14,
    paddingBottom: 14,
    fontStyle: 'italic',
  },
  favRow: {
    paddingHorizontal: 10,
    gap: 8,
    paddingBottom: 12,
  },
  favCard: {
    width: 80,
    height: 76,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  favCardActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceActive,
  },
  favCardName: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '400',
    textAlign: 'center',
  },
  favCardNameActive: {
    color: colors.textPrimary,
  },
  list: {
    flex: 1,
  },
  grid: {
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 8,
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
  discoverSection: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  discoverRow: {
    paddingHorizontal: 10,
    gap: 10,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accentBlue,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
    width: 200,
  },
  discoverIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  discoverText: {
    flex: 1,
  },
  discoverTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  discoverSubtitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.7,
  },
  timerArea: {
    height: 4,
  },
});
