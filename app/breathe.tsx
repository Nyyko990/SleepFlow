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
import { colors } from '../constants/colors';
import { BottomNav } from '../components/BottomNav';

type PhaseType = 'inhale' | 'hold' | 'exhale';

interface Phase {
  name: string;
  duration: number;
  type: PhaseType;
}

interface Technique {
  id: string;
  label: string;
  description: string;
  phases: Phase[];
}

const TECHNIQUES: Technique[] = [
  {
    id: '4-7-8',
    label: '4-7-8',
    description:
      'Developed by Dr. Andrew Weil. Activates the parasympathetic nervous system, reducing heart rate and cortisol.',
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Hold', duration: 7, type: 'hold' },
      { name: 'Exhale', duration: 8, type: 'exhale' },
    ],
  },
  {
    id: 'box',
    label: 'Box Breathing',
    description:
      'Used by Navy SEALs to manage stress. Balances CO₂ and O₂ levels, inducing calm within minutes.',
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Hold', duration: 4, type: 'hold' },
      { name: 'Exhale', duration: 4, type: 'exhale' },
      { name: 'Hold', duration: 4, type: 'hold' },
    ],
  },
  {
    id: 'diaphragmatic',
    label: 'Diaphragmatic',
    description:
      'A 2021 clinical study found this reduces sleep latency and nighttime disturbances significantly.',
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Exhale', duration: 8, type: 'exhale' },
    ],
  },
  {
    id: '2-1',
    label: '2:1 Breathing',
    description:
      'The extended exhale activates the vagus nerve, shifting the body from fight-or-flight to rest-and-digest.',
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Exhale', duration: 8, type: 'exhale' },
    ],
  },
];

const PHASE_COLORS: Record<PhaseType, string> = {
  inhale: '#2D5986',
  hold: '#2D1B4E',
  exhale: '#1A3A5C',
};

const TOTAL_CYCLES = 4;
const BASE_SIZE = 180;
const MAX_SIZE = 240;
// borderRadius must always exceed half of BASE_SIZE (90). Using MAX_SIZE/2 = 120 satisfies this.
const CIRCLE_RADIUS = MAX_SIZE / 2;
// Outer progress ring — fits around the circle at MAX_SIZE with some margin
const RING_SIZE = MAX_SIZE + 52;
const RING_RADIUS = RING_SIZE / 2;
const DOT_SIZE = 10;

export default function BreatheScreen() {
  const insets = useSafeAreaInsets();

  const [selectedTech, setSelectedTech] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [completed, setCompleted] = useState(false);

  const circleAnim = useRef(new Animated.Value(BASE_SIZE)).current;
  const progressRotation = useRef(new Animated.Value(0)).current;

  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);
  const sessionRef = useRef<{ phaseIdx: number; countdown: number; cycleCount: number } | null>(
    null,
  );

  const technique = TECHNIQUES[selectedTech];

  const animatePhase = useCallback(
    (idx: number, phases: Phase[]) => {
      const ph = phases[idx];
      const toSize = ph.type === 'inhale' ? MAX_SIZE : ph.type === 'exhale' ? BASE_SIZE : null;
      if (toSize !== null) {
        Animated.timing(circleAnim, {
          toValue: toSize,
          duration: ph.duration * 1000,
          useNativeDriver: false,
        }).start();
      }
    },
    [circleAnim],
  );

  const startProgressAnim = useCallback(
    (phases: Phase[]) => {
      const totalDur = phases.reduce((s, p) => s + p.duration, 0);
      progressRotation.setValue(0);
      Animated.timing(progressRotation, {
        toValue: 1,
        duration: totalDur * 1000,
        useNativeDriver: true,
      }).start();
    },
    [progressRotation],
  );

  const stopSession = useCallback(() => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    isRunningRef.current = false;
    sessionRef.current = null;
    circleAnim.stopAnimation();
    progressRotation.stopAnimation();
    setIsRunning(false);
    Animated.timing(circleAnim, {
      toValue: BASE_SIZE,
      duration: 500,
      useNativeDriver: false,
    }).start();
    progressRotation.setValue(0);
  }, [circleAnim, progressRotation]);

  const startSession = useCallback(() => {
    const phases = technique.phases;
    setCompleted(false);
    setIsRunning(true);
    setPhaseIdx(0);
    setCountdown(phases[0].duration);
    setCycleCount(0);

    isRunningRef.current = true;
    const session = { phaseIdx: 0, countdown: phases[0].duration, cycleCount: 0 };
    sessionRef.current = session;

    circleAnim.setValue(BASE_SIZE);
    animatePhase(0, phases);
    startProgressAnim(phases);

    tickRef.current = setInterval(() => {
      if (!isRunningRef.current || !sessionRef.current) return;

      sessionRef.current.countdown -= 1;
      setCountdown(sessionRef.current.countdown);

      if (sessionRef.current.countdown <= 0) {
        const nextIdx = (sessionRef.current.phaseIdx + 1) % phases.length;
        const isNewCycle = nextIdx === 0;

        if (isNewCycle) {
          sessionRef.current.cycleCount += 1;
          const newCount = sessionRef.current.cycleCount;
          setCycleCount(newCount);

          if (newCount >= TOTAL_CYCLES) {
            clearInterval(tickRef.current!);
            tickRef.current = null;
            isRunningRef.current = false;
            sessionRef.current = null;
            setIsRunning(false);
            setCompleted(true);
            return;
          }

          startProgressAnim(phases);
        }

        sessionRef.current.phaseIdx = nextIdx;
        sessionRef.current.countdown = phases[nextIdx].duration;
        setPhaseIdx(nextIdx);
        setCountdown(phases[nextIdx].duration);
        animatePhase(nextIdx, phases);
      }
    }, 1000);
  }, [technique, animatePhase, startProgressAnim, circleAnim]);

  const handleTechChange = useCallback(
    (idx: number) => {
      stopSession();
      setSelectedTech(idx);
      setPhaseIdx(0);
      setCountdown(0);
      setCycleCount(0);
      setCompleted(false);
    },
    [stopSession],
  );

  const handleReset = useCallback(() => {
    setCompleted(false);
    setPhaseIdx(0);
    setCountdown(0);
    setCycleCount(0);
    circleAnim.setValue(BASE_SIZE);
    progressRotation.setValue(0);
  }, [circleAnim, progressRotation]);

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  const progressSpin = progressRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const currentPhase = technique.phases[phaseIdx] ?? technique.phases[0];
  const phaseColor = isRunning ? PHASE_COLORS[currentPhase.type] : colors.accentBlue;
  const displayPhaseText = isRunning ? currentPhase.name : 'Ready';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.topBar}>
          <Text style={styles.brand}>SLEEPFLOW</Text>
        </View>
        <Text style={styles.heading}>Breathe</Text>

        {/* Technique selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.techRow}
          style={styles.techScroll}
        >
          {TECHNIQUES.map((t, i) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.techPill, selectedTech === i && styles.techPillActive]}
              onPress={() => handleTechChange(i)}
              activeOpacity={0.75}
            >
              <Text style={[styles.techPillText, selectedTech === i && styles.techPillTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Description card */}
        <View style={styles.descCard}>
          <Text style={styles.descText} numberOfLines={2}>
            {technique.description}
          </Text>
        </View>

        {/* Circle area */}
        <View style={styles.circleArea}>
          {/* Background ring */}
          <View style={styles.progressRing} />

          {/* Rotating progress dot */}
          <Animated.View
            style={[
              styles.progressDotContainer,
              { transform: [{ rotate: progressSpin }] },
            ]}
          >
            <View style={[styles.progressDot, { backgroundColor: phaseColor }]} />
          </Animated.View>

          {/* Breathing circle */}
          <Animated.View
            style={[
              styles.circle,
              {
                width: circleAnim,
                height: circleAnim,
                backgroundColor: phaseColor,
              },
            ]}
          >
            <Text style={styles.phaseText}>{displayPhaseText}</Text>
          </Animated.View>
        </View>

        {/* Countdown */}
        <Text style={styles.countdown}>{isRunning && countdown > 0 ? String(countdown) : ' '}</Text>

        {/* Cycle counter / completion */}
        {isRunning && !completed && (
          <Text style={styles.cycleText}>
            Cycle {cycleCount + 1} of {TOTAL_CYCLES}
          </Text>
        )}

        {completed && (
          <Text style={styles.completedText}>
            {'Well done.\nYour body is ready to sleep. 🌙'}
          </Text>
        )}

        {!isRunning && !completed && <View style={styles.cycleTextPlaceholder} />}

        {/* Controls */}
        <View style={styles.controls}>
          {completed ? (
            <TouchableOpacity style={styles.startBtn} onPress={handleReset} activeOpacity={0.8}>
              <Text style={styles.startBtnText}>Try again</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.startBtn, isRunning && styles.stopBtn]}
              onPress={isRunning ? stopSession : startSession}
              activeOpacity={0.8}
            >
              <Text style={styles.startBtnText}>{isRunning ? 'Stop' : 'Start'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: 16,
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
    paddingBottom: 14,
    opacity: 0.9,
  },
  techScroll: {
    flexGrow: 0,
    marginBottom: 14,
  },
  techRow: {
    paddingHorizontal: 14,
    gap: 8,
  },
  techPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  techPillActive: {
    backgroundColor: colors.pillActive,
    borderColor: colors.accentBlue,
  },
  techPillText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
  },
  techPillTextActive: {
    color: colors.textPrimary,
  },
  descCard: {
    marginHorizontal: 14,
    marginBottom: 24,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  descText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    opacity: 0.8,
  },
  circleArea: {
    width: RING_SIZE,
    height: RING_SIZE,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: RING_RADIUS,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  progressDotContainer: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: 'center',
  },
  progressDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginTop: -(DOT_SIZE / 2),
  },
  circle: {
    borderRadius: CIRCLE_RADIUS,
    alignItems: 'center',
    justifyContent: 'center',
    shadowRadius: 24,
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 0 },
    shadowColor: colors.accentBlue,
    elevation: 8,
  },
  phaseText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: 0.5,
  },
  countdown: {
    color: colors.textSecondary,
    fontSize: 48,
    fontWeight: '100',
    textAlign: 'center',
    marginTop: 16,
    opacity: 0.5,
    letterSpacing: 2,
    height: 60,
  },
  cycleText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.5,
    marginTop: 4,
  },
  cycleTextPlaceholder: {
    height: 22,
  },
  completedText: {
    color: colors.textPrimary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.85,
    marginTop: 4,
  },
  controls: {
    alignItems: 'center',
    marginTop: 28,
  },
  startBtn: {
    width: 140,
    paddingVertical: 14,
    borderRadius: 28,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
  },
  stopBtn: {
    backgroundColor: colors.accentPurple,
    borderWidth: 1,
    borderColor: colors.accentBlue,
  },
  startBtnText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
});
