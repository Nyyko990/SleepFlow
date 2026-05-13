import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
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
import type { SoundDef } from '../constants/sounds';
import { LoadingScreen } from '../components/LoadingScreen';
import { SoundModal } from '../components/SoundModal';
import { RecordingModal } from '../components/RecordingModal';
import { FeaturedBanner } from '../components/FeaturedBanner';
import { BottomNav } from '../components/BottomNav';
import { useAudio } from '../context/AudioContext';

const FAVORITES_KEY = 'favorite_sounds';
const RECENT_MAX = 3;

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

const SLEEP_COMBOS = [
  { id: 'c-rain-fire', name: 'Cozy Rain', sounds: ['rain', 'fire'], icon: 'flame-outline' as const },
  { id: 'c-forest-ocean', name: 'Forest Shore', sounds: ['forest', 'ocean'], icon: 'leaf-outline' as const },
  { id: 'c-ocean-white', name: 'Deep Waves', sounds: ['ocean', 'whitenoise'], icon: 'water-outline' as const },
];

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

  const favoriteSounds: SoundDef[] = allSounds.filter(s => favorites.includes(s.id));
  const recentSounds: SoundDef[] = allSounds.slice(0, RECENT_MAX);

  const handleComboPress = useCallback((soundIds: string[]) => {
    const anyActive = soundIds.some(id => allActive[id]);
    soundIds.forEach(id => {
      if (anyActive && allActive[id]) handleToggle(id);
      else if (!anyActive && !allActive[id]) handleToggle(id);
    });
  }, [allActive, handleToggle]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.topBar}>
          <Text style={styles.brand}>SLEEPFLOW</Text>
          <TouchableOpacity style={styles.settingsBtn} activeOpacity={0.7} hitSlop={8}>
            <Ionicons name="settings-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.greeting}>Good night</Text>

        {/* Featured Banner */}
        <FeaturedBanner />

        {/* FAVORITES */}
        <Text style={styles.sectionLabel}>FAVORITES</Text>
        {favoriteSounds.length === 0 ? (
          <Text style={styles.emptyHint}>Hold any sound to favorite it ♡</Text>
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

        {/* RECENT SOUNDS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>RECENT SOUNDS</Text>
          <TouchableOpacity onPress={() => router.push('/sounds')} hitSlop={8}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.favRow}
        >
          {recentSounds.map(sound => (
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

        {/* DISCOVER */}
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

        {/* SLEEP COMBOS */}
        <Text style={styles.sectionLabel}>SLEEP COMBOS</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.comboRow}
        >
          {SLEEP_COMBOS.map(combo => {
            const isActive = combo.sounds.some(id => allActive[id]);
            return (
              <TouchableOpacity
                key={combo.id}
                style={[styles.comboCard, isActive && styles.comboCardActive]}
                onPress={() => handleComboPress(combo.sounds)}
                activeOpacity={0.8}
              >
                <View style={[styles.comboIconWrap, isActive && styles.comboIconWrapActive]}>
                  <Ionicons
                    name={combo.icon}
                    size={20}
                    color={isActive ? colors.accentBlue : colors.textSecondary}
                  />
                </View>
                <Text style={[styles.comboName, isActive && styles.comboNameActive]}>{combo.name}</Text>
                <Text style={styles.comboSounds}>{combo.sounds.join(' + ')}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={styles.bottomPad} />
      </ScrollView>

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
  scrollContent: {
    paddingBottom: 8,
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
    paddingTop: 4,
    opacity: 0.9,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 14,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 8,
  },
  seeAll: {
    color: colors.accentBlue,
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.8,
    paddingTop: 16,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: 12,
    opacity: 0.4,
    paddingHorizontal: 14,
    paddingBottom: 8,
    fontStyle: 'italic',
  },
  favRow: {
    paddingHorizontal: 10,
    gap: 8,
    paddingBottom: 4,
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
  discoverRow: {
    paddingHorizontal: 10,
    gap: 10,
    paddingBottom: 4,
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
  comboRow: {
    paddingHorizontal: 10,
    gap: 10,
    paddingBottom: 4,
  },
  comboCard: {
    width: 130,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 14,
    gap: 6,
  },
  comboCardActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceActive,
  },
  comboIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentPurple,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  comboIconWrapActive: {
    backgroundColor: colors.pillActive,
  },
  comboName: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  comboNameActive: {
    color: colors.textPrimary,
  },
  comboSounds: {
    color: colors.textSecondary,
    fontSize: 10,
    opacity: 0.5,
  },
  timerArea: {
    height: 4,
  },
  bottomPad: {
    height: 8,
  },
});
