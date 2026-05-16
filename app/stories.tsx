import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import type { IoniconName } from '../constants/sounds';
import { BottomNav } from '../components/BottomNav';
import { useAudio } from '../context/AudioContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const READ_TEXT_COLOR = '#C8C8D8';
const FREE_GREEN = '#2D6A4F';
// Word-by-word: ms per word for speeds 1–5
const WBW_INTERVALS = [1200, 800, 550, 400, 300];
// Auto-scroll: ms per 30px tick for speeds 1–5
const AUTOSCROLL_INTERVALS = [3000, 1800, 1400, 1100, 800];

interface Story {
  id: string;
  title: string;
  icon: IoniconName;
  iconColor: string;
  durationMin: number;
  durationSecs: number;
  text: string;
  isPremium?: boolean;
  price?: string;
  disclaimer?: string;
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

const PREMIUM_STORIES: Story[] = [
  {
    id: 'journey-of-wukong',
    title: 'The Journey of Wukong',
    icon: 'flash-outline',
    iconColor: '#7B2D00',
    durationMin: 8,
    durationSecs: 480,
    isPremium: true,
    price: '$0.99',
    text: `The Monkey King had run the length of three celestial rivers that day. Now he sat beneath a banyan tree on a hillside above the clouds, his golden staff laid across his knees, and looked out at the slow wheel of the moon as it rose above the eastern peaks. For once, there was nothing to fight. No demon demanding tribute, no general to outrun. Just the cool weight of the night and the faint silver light drifting down through the leaves.

He breathed in. The air was thin here, dry and still, carrying the faint smell of pine from the slopes below. High up, the stars were different — closer, somehow, as though they had come out to look at him. He recognised a few of them. Old friends, or old enemies, which sometimes amounted to the same thing. He watched one drift slowly west and decided it was probably neither.

His eyes grew heavy. That was unusual. He had never needed much sleep — a quality he had always been proud of. But the warmth from the day still clung to the bark of the tree at his back, and the ground was soft with old pine needles, and the moon was drawing everything quietly into its orbit. He stopped thinking about the road ahead and simply listened to the night: the distant sound of water somewhere below, the breath of wind through the highest branches.

The staff grew lighter in his hands. His shoulders settled. The great stone face of the mountain across the valley blurred at its edges and the stars behind it softened into something warm and undifferentiated. The Monkey King let his head fall back gently against the bark and did not fight what came next.`,
  },
  {
    id: 'dragons-search',
    title: "Dragon's Search",
    icon: 'water-outline',
    iconColor: '#0D3B6E',
    durationMin: 10,
    durationSecs: 600,
    isPremium: true,
    price: '$0.99',
    text: `The dragon had no name for what it was looking for, only the feeling that it had once been somewhere near water — a particular kind of water, wide and slow and cold, lined with reeds that whispered when the wind came through. It drifted through the clouds now, massive and unhurried, its scales barely catching the last light of a sun that had already fallen below the mountains.

Below, the land was dark. Villages had lit their lamps, small yellow squares scattered across the valleys like scattered embers. The dragon passed over them without slowing. They were not what it was looking for. It turned its great head north, following a faint sensation in its chest — not urgency, nothing so sharp as that. Just a gentle pull, the way a sleeping animal turns toward warmth without waking.

The air was colder now. The dragon descended a little, angling through a gap in the clouds, and felt the temperature change against its neck. Below, a plain opened up, pale silver in the moonlight, cut through by a dark winding line. A river. The dragon circled once, slowly, and looked down at the dark water coiling through the grass. Something in it eased. This was close. Not exactly right, but close enough for now.

It settled to the bank without sound. The water moved past quietly, indifferent, carrying its cold from somewhere distant. The dragon lowered its head until its chin rested on its forelimbs, and watched the river. The reeds nearby swayed. The moon rose higher. The dragon had been searching a long time, and it was tired in a way that had nothing to do with distance, and the sound of the water said: not yet, but soon. Rest now.`,
  },
  {
    id: 'ember-night',
    title: 'The Last Airbender: Ember Night',
    icon: 'leaf-outline',
    iconColor: '#2D4A1E',
    durationMin: 9,
    durationSecs: 540,
    isPremium: true,
    price: '$0.99',
    disclaimer: 'Fan story · Not official',
    text: `Appa flew with his eyes half-closed, reading the air the way only he could — feeling the warm current rising off the mountains far below and leaning into it without being told. Aang sat cross-legged on the saddle, hands resting open in his lap, and let the wind take his thoughts one by one until there were none left worth keeping. The sky up here was the kind of dark that had depth to it, layered and still, and the stars seemed to breathe.

He had been practicing sitting still. It was harder than it sounded. Normally his mind ran ahead of him, planning the next move, the next conversation, the next bend in the road. But Monk Gyatso had told him once that the sky doesn't hurry, and tonight it seemed important to understand what that meant. He tried it. He sat still. The wind came and went without him chasing it.

Below, far away, a village was asleep. He could see the last lamp going out in the window of someone's house. He wondered briefly what they were dreaming about, and then let the wondering go too. Appa exhaled slowly, a low rumble that Aang felt in his whole body, and tucked his great paws in a little. They were both getting sleepy. The night had that quality about it — patient and soft-edged, not asking anything of anyone.

Aang lay back on the saddle and looked up. The stars didn't arrange themselves into anything meaningful tonight. They were just themselves: old, quiet, impossibly far away, and completely unbothered. He found that he didn't need them to be anything else. His breathing slowed. The wind carried Appa steadily onward through the dark, and Aang closed his eyes and let the sky hold them both.`,
  },
];

const ROWS: { label: string; stories: Story[] }[] = [
  { label: 'FREE STORIES', stories: STORIES },
  { label: 'FANTASY WORLDS', stories: PREMIUM_STORIES },
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
      {story.isPremium && (
        <View style={styles.lockIcon}>
          <Ionicons name="lock-closed-outline" size={12} color={colors.textSecondary} />
        </View>
      )}
      <View style={[styles.cardIconWrap, { backgroundColor: story.iconColor }]}>
        <Ionicons name={story.icon} size={28} color="rgba(255,255,255,0.85)" />
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>{story.title}</Text>
      {story.disclaimer ? (
        <Text style={styles.disclaimer} numberOfLines={1}>{story.disclaimer}</Text>
      ) : null}
      <View style={styles.cardSpacer} />
      <View style={styles.cardBadges}>
        <View style={styles.durationBadge}>
          <Text style={styles.badgeText}>{story.durationMin} min</Text>
        </View>
        {story.isPremium ? (
          <View style={styles.priceBadge}>
            <Text style={styles.badgeText}>{story.price}</Text>
          </View>
        ) : (
          <View style={styles.freeBadge}>
            <Text style={styles.badgeText}>FREE</Text>
          </View>
        )}
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
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);

  const [guideOn, setGuideOn] = useState(false);
  const [guideMode, setGuideMode] = useState<'autoscroll' | 'wordbyword'>('autoscroll');
  const [guideSpeed, setGuideSpeed] = useState(2);
  const [guideRunning, setGuideRunning] = useState(false);
  const [highlightedWordIdx, setHighlightedWordIdx] = useState(-1);

  const isPlayingRef = useRef(false);
  isPlayingRef.current = isPlaying;
  const mixWithSoundsRef = useRef(false);
  mixWithSoundsRef.current = mixWithSounds;
  const speedRef = useRef<Speed>(1);
  speedRef.current = speed;
  const guideOnRef = useRef(guideOn);
  guideOnRef.current = guideOn;
  const guideModeRef = useRef(guideMode);
  guideModeRef.current = guideMode;

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const readScrollRef = useRef<ScrollView>(null);
  const guideScrollY = useRef(0);
  const guideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Parse story into paragraphs of words for guided reading
  const storyParagraphs = useMemo((): string[][] => {
    if (!openedStory) return [];
    return openedStory.text.split(/\n\n/).map(p => p.trim().split(/\s+/));
  }, [openedStory]);

  // Flat start index for each paragraph (used in word-by-word render)
  const paragraphStartIndices = useMemo(() => {
    const indices: number[] = [];
    let idx = 0;
    for (const para of storyParagraphs) {
      indices.push(idx);
      idx += para.length;
    }
    return indices;
  }, [storyParagraphs]);

  const totalWordCount = useMemo(
    () => storyParagraphs.reduce((sum, p) => sum + p.length, 0),
    [storyParagraphs],
  );
  const totalWordCountRef = useRef(totalWordCount);
  totalWordCountRef.current = totalWordCount;

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Listen mode playback timer
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

  // Guide on/off — autoscroll starts running, wordbyword waits for play button
  useEffect(() => {
    if (guideOn) {
      setHighlightedWordIdx(0);
      guideScrollY.current = 0;
      setGuideRunning(guideModeRef.current !== 'wordbyword');
    } else {
      setGuideRunning(false);
      setHighlightedWordIdx(-1);
    }
  }, [guideOn]);

  // Reset position on sub-mode switch (no stale-closure issue — guideOnRef read inside)
  useEffect(() => {
    if (!guideOnRef.current) return;
    setHighlightedWordIdx(0);
    guideScrollY.current = 0;
    setGuideRunning(guideMode === 'autoscroll');
  }, [guideMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Guide timer
  useEffect(() => {
    if (guideTimerRef.current) {
      clearInterval(guideTimerRef.current);
      guideTimerRef.current = null;
    }
    if (!guideOn || !guideRunning || mode !== 'read') return;

    const intervalIdx = Math.min(Math.max(guideSpeed - 1, 0), 4);

    if (guideMode === 'autoscroll') {
      const interval = AUTOSCROLL_INTERVALS[intervalIdx];
      guideTimerRef.current = setInterval(() => {
        guideScrollY.current += 30;
        readScrollRef.current?.scrollTo({ y: guideScrollY.current, animated: true });
      }, interval);
    } else {
      const interval = WBW_INTERVALS[intervalIdx];
      guideTimerRef.current = setInterval(() => {
        setHighlightedWordIdx(prev => {
          if (prev >= totalWordCountRef.current - 1) {
            if (guideTimerRef.current) {
              clearInterval(guideTimerRef.current);
              guideTimerRef.current = null;
            }
            setGuideRunning(false);
            return prev;
          }
          return prev + 1;
        });
      }, interval);
    }

    return () => {
      if (guideTimerRef.current) {
        clearInterval(guideTimerRef.current);
        guideTimerRef.current = null;
      }
    };
  }, [guideOn, guideRunning, guideMode, guideSpeed, mode]);

  const handleOpen = useCallback(
    (story: Story) => {
      if (story.isPremium) {
        setShowPurchaseModal(true);
        return;
      }
      setOpenedStory(story);
      setMode('listen');
      setIsPlaying(false);
      setCurrentTime(0);
      setReadScrollPct(0);
      setGuideOn(false);
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
    setGuideOn(false);
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

  const toggleGuideRunning = useCallback(() => {
    setGuideRunning(v => !v);
  }, []);

  const isWbwFinished =
    guideOn &&
    guideMode === 'wordbyword' &&
    !guideRunning &&
    totalWordCount > 0 &&
    highlightedWordIdx >= totalWordCount - 1;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
            <Text style={styles.brand}>SLEEPFLOW</Text>
            <Text style={styles.heading}>Sleep Stories</Text>
          </View>

          <View style={styles.infoCard}>
            <View style={styles.infoCardHeader}>
              <Ionicons name="information-circle-outline" size={24} color={colors.textSecondary} style={styles.infoIcon} />
              <Text style={styles.infoTitle}>Why stories help you sleep</Text>
            </View>
            <Text style={styles.infoBody}>
              {'Narrative distraction quiets the default mode network — the part of your brain responsible for rumination and worry. A slow, descriptive story gives your mind something gentle to follow, easing the transition into sleep.'}
            </Text>
            <View style={styles.statPills}>
              {(['✦ Reduces overthinking', '✦ Faster sleep onset', '✦ Works in 6–10 min'] as const).map(stat => (
                <View key={stat} style={styles.statPill}>
                  <Text style={styles.statPillText}>{stat}</Text>
                </View>
              ))}
            </View>
          </View>

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
                    key={story.id}
                    story={story}
                    onPress={() => handleOpen(story)}
                  />
                ))}
              </ScrollView>
            </View>
          ))}

          <View style={styles.bottomPad} />
        </ScrollView>

        {openedStory !== null && (
          <Animated.View
            style={[styles.playerPanel, { transform: [{ translateY: slideAnim }] }]}
          >
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

            {mode === 'listen' && (
              <ScrollView
                contentContainerStyle={styles.listenContent}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.playerTitle}>{openedStory.title}</Text>
                <Text style={styles.playerTime}>
                  {formatTime(currentTime)} / {formatTime(openedStory.durationSecs)}
                </Text>

                <View style={[styles.playerIconWrap, { backgroundColor: openedStory.iconColor }]}>
                  <Ionicons name={openedStory.icon} size={44} color="rgba(255,255,255,0.85)" />
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${Math.min((currentTime / openedStory.durationSecs) * 100, 100)}%` },
                    ]}
                  />
                </View>

                <View style={styles.controls}>
                  <TouchableOpacity onPress={handleRewind} activeOpacity={0.7} hitSlop={8}>
                    <Ionicons name="play-back-outline" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.playBtn} onPress={handlePlayPause} activeOpacity={0.85}>
                    <Ionicons name={isPlaying ? 'pause' : 'play'} size={30} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleForward} activeOpacity={0.7} hitSlop={8}>
                    <Ionicons name="play-forward-outline" size={28} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

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

            {mode === 'read' && (
              <View style={styles.readContainer}>
                <View style={styles.readProgressTrack}>
                  <View style={[styles.readProgressFill, { width: `${readScrollPct * 100}%` }]} />
                </View>

                <View style={styles.readHeaderRow}>
                  <Text style={styles.readTitle} numberOfLines={1}>{openedStory.title}</Text>
                  <TouchableOpacity
                    style={[styles.guidePill, guideOn && styles.guidePillOn]}
                    onPress={() => setGuideOn(v => !v)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.guidePillText, guideOn && styles.guidePillTextOn]}>
                      {guideOn ? 'Guide ON' : 'Guide OFF'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {guideOn && (
                  <View style={styles.guideControls}>
                    <View style={styles.guideSubPills}>
                      {(['autoscroll', 'wordbyword'] as const).map(m => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.guideSubPill, guideMode === m && styles.guideSubPillActive]}
                          onPress={() => setGuideMode(m)}
                          activeOpacity={0.75}
                        >
                          <Text style={[styles.guideSubPillText, guideMode === m && styles.guideSubPillTextActive]}>
                            {m === 'autoscroll' ? 'Auto-scroll' : 'Word by word'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={styles.sliderRow}>
                      <Text style={styles.sliderLabel}>Slow</Text>
                      <Slider
                        style={styles.guideSlider}
                        minimumValue={1}
                        maximumValue={5}
                        step={1}
                        value={guideSpeed}
                        onValueChange={(v: number) => setGuideSpeed(Math.round(v))}
                        minimumTrackTintColor={colors.accentBlue}
                        maximumTrackTintColor={colors.border}
                        thumbTintColor={colors.tabActive}
                      />
                      <Text style={styles.sliderLabel}>Fast</Text>
                    </View>
                    {guideMode === 'wordbyword' && (
                      <View style={styles.wbwPlayRow}>
                        <TouchableOpacity
                          style={styles.wbwPlayBtn}
                          onPress={toggleGuideRunning}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={guideRunning ? 'pause' : 'play'}
                            size={22}
                            color={colors.textPrimary}
                          />
                        </TouchableOpacity>
                        {isWbwFinished && (
                          <Text style={styles.wbwFinishedText}>Finished ✓</Text>
                        )}
                      </View>
                    )}
                  </View>
                )}

                <ScrollView
                  ref={readScrollRef}
                  style={styles.readScroll}
                  contentContainerStyle={styles.readContent}
                  showsVerticalScrollIndicator={false}
                  onScroll={handleReadScroll}
                  scrollEventThrottle={16}
                  onTouchStart={guideOn && guideMode === 'autoscroll' ? toggleGuideRunning : undefined}
                >
                  {guideOn && guideMode === 'wordbyword'
                    ? storyParagraphs.map((words, pIdx) => {
                        const startIdx = paragraphStartIndices[pIdx];
                        return (
                          <Text
                            key={pIdx}
                            style={[styles.readText, pIdx > 0 && styles.readParaGap]}
                          >
                            {words.map((word, wIdx) => {
                              const flatIdx = startIdx + wIdx;
                              return (
                                <Text
                                  key={wIdx}
                                  onPress={() => {
                                    setHighlightedWordIdx(flatIdx);
                                    setGuideRunning(false);
                                  }}
                                  style={flatIdx === highlightedWordIdx ? styles.highlightedWord : undefined}
                                >
                                  {word}{' '}
                                </Text>
                              );
                            })}
                          </Text>
                        );
                      })
                    : openedStory.text.split(/\n\n/).map((para, i) => (
                        <Text key={i} style={[styles.readText, i > 0 && styles.readParaGap]}>
                          {para.trim()}
                        </Text>
                      ))
                  }
                </ScrollView>
              </View>
            )}
          </Animated.View>
        )}
      </View>

      <BottomNav />

      <Modal
        visible={showPurchaseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPurchaseModal(false)}
      >
        <View style={styles.purchaseOverlay}>
          <View style={styles.purchaseCard}>
            <View style={styles.purchaseIconRow}>
              <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
              <Ionicons name="planet-outline" size={20} color={colors.textSecondary} />
              <Ionicons name="flame-outline" size={20} color={colors.textSecondary} />
            </View>
            <Text style={styles.purchaseTitle}>Fantasy Worlds</Text>
            <Text style={styles.purchaseDesc}>Unlock 3 epic sleep stories</Text>
            <Text style={styles.purchasePrice}>$2.99</Text>
            <TouchableOpacity style={styles.purchaseBtn} activeOpacity={0.85}>
              <Text style={styles.purchaseBtnText}>Purchase</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.purchaseDismiss}
              onPress={() => setShowPurchaseModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.purchaseDismissText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  infoCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  infoIcon: {
    opacity: 0.6,
  },
  infoTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  infoBody: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.8,
    marginBottom: 12,
  },
  statPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statPillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '400',
    opacity: 0.7,
  },
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
  lockIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    opacity: 0.5,
    zIndex: 1,
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
  disclaimer: {
    color: colors.textSecondary,
    fontSize: 9,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 2,
    fontStyle: 'italic',
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
  priceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: colors.accentPurple,
    borderWidth: 1,
    borderColor: colors.accentBlue,
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
    backgroundColor: 'transparent',
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
  readHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 12,
  },
  readTitle: {
    flex: 1,
    color: READ_TEXT_COLOR,
    fontSize: 18,
    fontWeight: '500',
    opacity: 0.7,
  },
  guidePill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guidePillOn: {
    backgroundColor: colors.pillActive,
    borderColor: colors.accentBlue,
  },
  guidePillText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  guidePillTextOn: {
    color: colors.textPrimary,
  },
  guideControls: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    gap: 8,
  },
  guideSubPills: {
    flexDirection: 'row',
    gap: 8,
  },
  guideSubPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  guideSubPillActive: {
    backgroundColor: colors.pillActive,
    borderColor: colors.accentBlue,
  },
  guideSubPillText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  guideSubPillTextActive: {
    color: colors.textPrimary,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sliderLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    opacity: 0.6,
  },
  guideSlider: {
    flex: 1,
    height: 32,
  },
  wbwPlayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 4,
  },
  wbwPlayBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accentBlue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  wbwFinishedText: {
    color: colors.textSecondary,
    fontSize: 13,
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
  readParaGap: {
    marginTop: 16,
  },
  highlightedWord: {
    backgroundColor: 'rgba(74,124,181,0.25)',
    borderRadius: 3,
    paddingHorizontal: 2,
    color: READ_TEXT_COLOR,
  },
  // Purchase modal
  purchaseOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  purchaseCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.accentPurple,
    padding: 28,
    alignItems: 'center',
  },
  purchaseIconRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
    opacity: 0.6,
  },
  purchaseTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  purchaseDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
  },
  purchasePrice: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '300',
    letterSpacing: 1,
    marginBottom: 24,
  },
  purchaseBtn: {
    width: '100%',
    backgroundColor: colors.accentBlue,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  purchaseBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  purchaseDismiss: {
    paddingVertical: 8,
  },
  purchaseDismissText: {
    color: colors.textSecondary,
    fontSize: 13,
    opacity: 0.6,
  },
});
