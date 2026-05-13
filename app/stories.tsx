import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import type { IoniconName } from '../constants/sounds';
import { BottomNav } from '../components/BottomNav';
import { useAudio } from '../context/AudioContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const READ_TEXT_COLOR = '#C8C8D8';
const READ_BG = '#070710';
const FREE_GREEN = '#2D6A4F';

interface Story {
  id: string;
  title: string;
  icon: IoniconName;
  iconColor: string;
  durationMin: number;
  durationSecs: number;
  text: string;
}

const STORIES: Story[] = [
  {
    id: 'crystal-forest',
    title: 'The Crystal Forest',
    icon: 'leaf-outline',
    iconColor: '#1B4332',
    durationMin: 7,
    durationSecs: 420,
    text: `A slow walk through a forest where the trees are made of translucent crystal, humming softly in the wind. The light bends through their branches, painting the ground in shifting rainbows. You follow a path of smooth stones deeper into the forest, each step quieter than the last.

The crystal trees grow taller as you walk deeper, their trunks wide enough to embrace. You rest your palm against one and feel a low, steady vibration — like the earth itself is breathing. Tiny motes of golden light drift upward through the branches, dissolving into the pale sky above.

Somewhere ahead, you hear water. A small stream runs over a bed of crystal pebbles, each one catching light and bending it into colors that dance softly on the mossy bank. You sit beside it and listen. The sound is gentle, almost musical, and your breath begins to slow to match its quiet rhythm.

The forest settles into stillness around you. The crystals hum their low, endless song. Your shoulders drop. Your eyes grow heavy. The shifting colors beneath the canopy blur into something warm and formless, like the edge of a dream. You are still. You are safe. You sleep.`,
  },
  {
    id: 'floating-library',
    title: 'The Floating Library',
    icon: 'book-outline',
    iconColor: '#1A237E',
    durationMin: 9,
    durationSecs: 540,
    text: `High above the clouds, there is a library that drifts with the wind. Its shelves stretch endlessly in every direction, filled with books that glow faintly in the dark. You find a reading chair by a circular window and sink into it, the cushions molding perfectly around you.

The library moves slowly, tilting with each gentle current of air. Through the window, clouds pass below like soft white islands in a blue ocean. A warm brass lamp beside you casts a golden circle of light. The books nearest to you have no titles on their spines. They open to whatever story you need.

You pick one up. The pages are slightly warm, and the words seem to rearrange themselves as you read, finding the right pace for tonight. You read a few lines — something about a river at dusk, and a field of tall grass, and someone lying very still — and then you let the book rest open in your lap.

The library rises gently into the evening sky. Outside, the stars appear one by one, unhurried. The lamp dims to a soft amber. The chair holds you completely. Your breathing has slowed without you noticing. The words on the page have gone soft and distant, like voices from the next room. You are nearly there. Let the library carry you.`,
  },
  {
    id: 'moon-garden',
    title: 'The Moon Garden',
    icon: 'moon-outline',
    iconColor: '#2D1B4E',
    durationMin: 6,
    durationSecs: 360,
    text: `On the far side of the moon, hidden from all starlight, there grows a garden that blooms only in silence. The flowers are silver and impossibly soft, their petals curved like cupped hands. You walk barefoot on the cool lunar soil, which is fine as powder and holds the shape of each footprint.

The garden has no edges you can find. It extends in all directions, curving gently with the surface of the moon. As you walk, the flowers brush your ankles and each one releases a faint blue-white glow that lingers in the air behind you — a trail of light marking the path you came from, growing dimmer as you walk further in.

You find a wide flat stone near the center of the garden. It is smooth and holds just enough warmth. You lie down on it and look up. The sky above the moon is filled with stars so dense they form clouds of light. Your body grows heavier. Your arms fall open. The garden breathes around you, slowly.

There is no sound here. Only the feeling of weight lifting — gradually, gently — as if the moon is drawing everything unnecessary out of you. The flowers close one by one. The stars hold still. The garden holds its breath. And so do you, for just a moment, before you let go completely.`,
  },
];

const ROWS: { label: string; stories: Story[] }[] = [
  { label: 'FANTASY WORLDS', stories: STORIES },
  { label: 'DREAMY ESCAPES', stories: STORIES },
];

const SPEEDS = [0.75, 1, 1.25, 1.5] as const;
type Speed = typeof SPEEDS[number];

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

interface StoryCardProps {
  story: Story;
  onPress: () => void;
}

function StoryCard({ story, onPress }: StoryCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={[styles.cardIconWrap, { backgroundColor: story.iconColor }]}>
        <Ionicons name={story.icon} size={28} color="rgba(255,255,255,0.85)" />
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{story.title}</Text>
      <View style={styles.cardSpacer} />
      <View style={styles.cardBadges}>
        <View style={styles.durationBadge}>
          <Text style={styles.badgeText}>{story.durationMin} min</Text>
        </View>
        <View style={styles.freeBadge}>
          <Text style={styles.badgeText}>FREE</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function StoriesScreen() {
  const insets = useSafeAreaInsets();
  const { pauseAll, resumeAll } = useAudio();

  const [openedStory, setOpenedStory] = useState<Story | null>(null);
  const [mode, setMode] = useState<'listen' | 'read'>('listen');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState<Speed>(1);
  const [mixWithSounds, setMixWithSounds] = useState(false);
  const [readScrollPct, setReadScrollPct] = useState(0);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const mixWithSoundsRef = useRef(false);
  mixWithSoundsRef.current = mixWithSounds;
  const speedRef = useRef<Speed>(1);
  speedRef.current = speed;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isPlaying && openedStory) {
      const story = openedStory;
      timerRef.current = setInterval(() => {
        setCurrentTime(t => {
          const next = t + speedRef.current;
          if (next >= story.durationSecs) {
            setIsPlaying(false);
            return story.durationSecs;
          }
          return next;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return clearTimer;
  }, [isPlaying, openedStory, clearTimer]);

  const handleOpen = useCallback(
    (story: Story) => {
      setOpenedStory(story);
      setMode('listen');
      setIsPlaying(false);
      setCurrentTime(0);
      setReadScrollPct(0);
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 22,
        stiffness: 200,
      }).start();
    },
    [slideAnim],
  );

  const handleClose = useCallback(() => {
    if (isPlayingRef.current) {
      if (!mixWithSoundsRef.current) resumeAll();
      setIsPlaying(false);
    }
    Animated.timing(slideAnim, {
      toValue: SCREEN_HEIGHT,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setOpenedStory(null));
  }, [slideAnim, resumeAll]);

  const handlePlayPause = useCallback(() => {
    if (!isPlayingRef.current) {
      if (!mixWithSoundsRef.current) pauseAll();
      setIsPlaying(true);
    } else {
      if (!mixWithSoundsRef.current) resumeAll();
      setIsPlaying(false);
    }
  }, [pauseAll, resumeAll]);

  const handleRewind = useCallback(() => {
    setCurrentTime(t => Math.max(0, t - 15));
  }, []);

  const handleForward = useCallback(() => {
    if (!openedStory) return;
    setCurrentTime(t => Math.min(openedStory.durationSecs, t + 15));
  }, [openedStory]);

  const handleReadScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const scrollable = contentSize.height - layoutMeasurement.height;
      if (scrollable <= 0) return;
      setReadScrollPct(Math.max(0, Math.min(1, contentOffset.y / scrollable)));
    },
    [],
  );

  return (
    <View style={styles.container}>
      {/* Main content area — player panel slides over this, BottomNav stays below */}
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.brand}>SLEEPFLOW</Text>
            <Text style={styles.heading}>Sleep Stories</Text>
          </View>

          {/* Story rows */}
          {ROWS.map(row => (
            <View key={row.label} style={styles.rowSection}>
              <Text style={styles.rowLabel}>{row.label}</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.rowScroll}
              >
                {row.stories.map(story => (
                  <StoryCard
                    key={`${row.label}-${story.id}`}
                    story={story}
                    onPress={() => handleOpen(story)}
                  />
                ))}
              </ScrollView>
            </View>
          ))}

          <View style={styles.bottomPad} />
        </ScrollView>

        {/* Story player panel — slides up over content, BottomNav remains below */}
        {openedStory !== null && (
          <Animated.View
            style={[
              styles.playerPanel,
              { transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Close + mode selector */}
            <View style={[styles.playerHeader, { paddingTop: insets.top + 12 }]}>
              <View style={styles.modePills}>
                {(['listen', 'read'] as const).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.modePill, mode === m && styles.modePillActive]}
                    onPress={() => setMode(m)}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.modePillText, mode === m && styles.modePillTextActive]}>
                      {m === 'listen' ? 'Listen' : 'Read'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* LISTEN mode */}
            {mode === 'listen' && (
              <ScrollView
                contentContainerStyle={styles.listenContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.playerTitle}>{openedStory.title}</Text>
                <Text style={styles.playerTime}>
                  {formatTime(currentTime)} / {formatTime(openedStory.durationSecs)}
                </Text>

                {/* Large icon */}
                <View style={[styles.playerIconWrap, { backgroundColor: openedStory.iconColor }]}>
                  <Ionicons name={openedStory.icon} size={44} color="rgba(255,255,255,0.85)" />
                </View>

                {/* Progress bar */}
                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((currentTime / openedStory.durationSecs) * 100, 100)}%` },
                    ]}
                  />
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                  <TouchableOpacity onPress={handleRewind} activeOpacity={0.7} hitSlop={8}>
                    <Ionicons name="play-back-outline" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playBtn}
                    onPress={handlePlayPause}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isPlaying ? 'pause' : 'play'}
                      size={30}
                      color={colors.textPrimary}
                    />
                  </TouchableOpacity>

                  <TouchableOpacity onPress={handleForward} activeOpacity={0.7} hitSlop={8}>
                    <Ionicons name="play-forward-outline" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Speed selector */}
                <View style={styles.speedRow}>
                  {SPEEDS.map(s => (
                    <TouchableOpacity
                      key={s}
                      style={[styles.speedPill, speed === s && styles.speedPillActive]}
                      onPress={() => setSpeed(s)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>
                        {s}x
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Mix toggle */}
                <View style={styles.mixRow}>
                  <View style={styles.mixLabel}>
                    <Text style={styles.mixTitle}>Play with background sounds</Text>
                    <Text style={styles.mixSub}>
                      {mixWithSounds ? 'Mixer keeps playing' : 'Mixer pauses while listening'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.toggle, mixWithSounds && styles.toggleOn]}
                    onPress={() => setMixWithSounds(v => !v)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.toggleThumb, mixWithSounds && styles.toggleThumbOn]} />
                  </TouchableOpacity>
                </View>

                {/* TODO: add narrated audio file */}
              </ScrollView>
            )}

            {/* READ mode */}
            {mode === 'read' && (
              <View style={styles.readContainer}>
                {/* Reading progress bar */}
                <View style={styles.readProgressTrack}>
                  <View style={[styles.readProgressFill, { width: `${readScrollPct * 100}%` }]} />
                </View>

                <Text style={styles.readTitle}>{openedStory.title}</Text>

                <ScrollView
                  style={styles.readScroll}
                  contentContainerStyle={styles.readContent}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleReadScroll}
                  scrollEventThrottle={16}
                >
                  <Text style={styles.readText}>{openedStory.text}</Text>
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}
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
  },
  scrollContent: {
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  brand: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    opacity: 0.7,
    marginBottom: 4,
  },
  heading: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '300',
    letterSpacing: 0.3,
    opacity: 0.9,
  },
  rowSection: {
    marginTop: 24,
  },
  rowLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 2,
    textTransform: 'uppercase',
    opacity: 0.5,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  rowScroll: {
    paddingHorizontal: 12,
    gap: 12,
  },
  bottomPad: {
    height: 16,
  },
  // Story card
  card: {
    width: 160,
    height: 200,
    borderRadius: 16,
    backgroundColor: '#0D0D1A',
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    alignSelf: 'center',
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 19,
  },
  cardSpacer: {
    flex: 1,
  },
  cardBadges: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  durationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.border,
  },
  freeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: FREE_GREEN,
  },
  badgeText: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Player panel
  playerPanel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  modePills: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  modePill: {
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  modePillActive: {
    backgroundColor: colors.pillActive,
    borderColor: colors.accentBlue,
  },
  modePillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  modePillTextActive: {
    color: colors.textPrimary,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Listen mode
  listenContent: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  playerTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 6,
  },
  playerTime: {
    color: colors.textSecondary,
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 32,
    letterSpacing: 0.5,
  },
  playerIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  progressTrack: {
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.accentBlue,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
    marginBottom: 32,
  },
  playBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentBlue,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 32,
  },
  speedPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  speedPillActive: {
    backgroundColor: colors.pillActive,
    borderColor: colors.accentBlue,
  },
  speedText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  speedTextActive: {
    color: colors.textPrimary,
  },
  mixRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 12,
  },
  mixLabel: {
    flex: 1,
  },
  mixTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  mixSub: {
    color: colors.textSecondary,
    fontSize: 11,
    opacity: 0.6,
  },
  toggle: {
    width: 46,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.border,
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  toggleOn: {
    backgroundColor: colors.accentBlue,
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textSecondary,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
    backgroundColor: colors.textPrimary,
  },
  // Read mode
  readContainer: {
    flex: 1,
    backgroundColor: READ_BG,
  },
  readProgressTrack: {
    height: 2,
    backgroundColor: colors.border,
    overflow: 'hidden',
  },
  readProgressFill: {
    height: '100%',
    backgroundColor: colors.accentBlue,
  },
  readTitle: {
    color: READ_TEXT_COLOR,
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    opacity: 0.7,
  },
  readScroll: {
    flex: 1,
  },
  readContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  readText: {
    color: READ_TEXT_COLOR,
    fontSize: 18,
    lineHeight: 30,
    fontWeight: '300',
  },
});
