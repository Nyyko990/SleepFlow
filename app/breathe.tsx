import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  tagline: string;
  timing: string;
  description: string;
  bestFor: string[];
  phases: Phase[];
}

const TECHNIQUES: Technique[] = [
  {
    id: '4-7-8',
    label: '4-7-8',
    tagline: 'SLEEP FASTER',
    timing: '4 · 7 · 8',
    description:
      'Developed by Dr. Andrew Weil. Activates the parasympathetic nervous system, reducing heart rate and cortisol.',
    bestFor: ['Anxiety before sleep', 'Racing thoughts', 'Falling asleep faster'],
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Hold', duration: 7, type: 'hold' },
      { name: 'Exhale', duration: 8, type: 'exhale' },
    ],
  },
  {
    id: 'box',
    label: 'Box',
    tagline: 'CALM THE MIND',
    timing: '4 · 4 · 4 · 4',
    description:
      'Used by Navy SEALs to manage stress. Balances CO₂ and O₂ levels, inducing calm within minutes.',
    bestFor: ['Stress and overthinking', 'Work/study recovery', 'Calming the nervous system'],
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Hold', duration: 4, type: 'hold' },
      { name: 'Exhale', duration: 4, type: 'exhale' },
      { name: 'Hold', duration: 4, type: 'hold' },
    ],
  },
  {
    id: 'diaphragmatic',
    label: 'Diaphragm',
    tagline: 'REDUCE DISTURBANCES',
    timing: '4 · 8',
    description:
      'A 2021 clinical study found this reduces sleep latency and nighttime disturbances significantly.',
    bestFor: ['Light sleepers', 'Nighttime disturbances', 'General sleep quality'],
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Exhale', duration: 8, type: 'exhale' },
    ],
  },
  {
    id: '2-1',
    label: '2:1',
    tagline: 'ACTIVATE REST',
    timing: '4 · 8',
    description:
      'The extended exhale activates the vagus nerve, shifting the body from fight-or-flight to rest-and-digest.',
    bestFor: ['General relaxation', 'Transitioning to sleep', 'Slowing heart rate'],
    phases: [
      { name: 'Inhale', duration: 4, type: 'inhale' },
      { name: 'Exhale', duration: 8, type: 'exhale' },
    ],
  },
];

const PHASE_DOT_COLORS: Record<PhaseType, string> = {
  inhale: '#4A7CB5',
  hold: '#6B4FA0',
  exhale: '#3A7A9C',
};

const TOTAL_CYCLES = 4;
const BASE_SIZE = 180;
const MAX_SIZE = 240;
const RING_SIZE = MAX_SIZE + 52;
const RING_RADIUS = RING_SIZE / 2;
const DOT_SIZE = 10;

interface ParticleLayer {
  scale: number;
  opacity: number;
  color: string;
  borderTopLeftRadius: number;
  borderTopRightRadius: number;
  borderBottomRightRadius: number;
  borderBottomLeftRadius: number;
}

const PARTICLE_LAYERS: ParticleLayer[] = [
  { scale: 1.00, opacity: 0.08, color: '#1A2A3A', borderTopLeftRadius: 118, borderTopRightRadius: 122, borderBottomRightRadius: 120, borderBottomLeftRadius: 116 },
  { scale: 0.86, opacity: 0.07, color: '#162436', borderTopLeftRadius: 124, borderTopRightRadius: 118, borderBottomRightRadius: 122, borderBottomLeftRadius: 120 },
  { scale: 0.72, opacity: 0.06, color: '#0D1B2A', borderTopLeftRadius: 117, borderTopRightRadius: 120, borderBottomRightRadius: 115, borderBottomLeftRadius: 122 },
  { scale: 0.58, opacity: 0.05, color: '#162436', borderTopLeftRadius: 121, borderTopRightRadius: 117, borderBottomRightRadius: 119, borderBottomLeftRadius: 123 },
  { scale: 0.42, opacity: 0.04, color: '#1A2A3A', borderTopLeftRadius: 119, borderTopRightRadius: 123, borderBottomRightRadius: 118, borderBottomLeftRadius: 120 },
];

export default function BreatheScreen() {
  const insets = useSafeAreaInsets();

  const [selectedTech, setSelectedTech] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [infoIdx, setInfoIdx] = useState<number | null>(null);

  const circleAnim = useRef(new Animated.Value(BASE_SIZE)).current;
  const progressRotation = useRef(new Animated.Value(0)).current;

  const layerAnims = useMemo(
    () => PARTICLE_LAYERS.map(l => Animated.multiply(circleAnim, l.scale)),
    [circleAnim],
  );

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
  const dotColor = isRunning ? PHASE_DOT_COLORS[currentPhase.type] : colors.accentBlue;
  const displayPhaseText = isRunning ? currentPhase.name : 'Ready';

  const infoTech = infoIdx !== null ? TECHNIQUES[infoIdx] : null;

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

        {/* Technique cards — long press opens info modal */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.techRow}
          style={styles.techScroll}
        >
          {TECHNIQUES.map((t, i) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.techCard, selectedTech === i && styles.techCardActive]}
              onPress={() => handleTechChange(i)}
              onLongPress={() => setInfoIdx(i)}
              delayLongPress={400}
              activeOpacity={0.75}
            >
              <Text style={[styles.techCardLabel, selectedTech === i && styles.techCardLabelActive]}>
                {t.label}
              </Text>
              <Text style={styles.techCardTagline}>{t.tagline}</Text>
              <Text style={styles.techCardTiming}>{t.timing}</Text>
              <Text style={styles.techCardDesc} numberOfLines={2}>{t.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Phase label ABOVE circle */}
        <Text style={styles.phaseLabel}>{displayPhaseText}</Text>

        {/* Circle area — particle aura layers */}
        <View style={styles.circleArea}>
          <View style={styles.progressRing} />

          <Animated.View
            style={[
              styles.progressDotContainer,
              { transform: [{ rotate: progressSpin }] },
            ]}
          >
            <View style={[styles.progressDot, { backgroundColor: dotColor }]} />
          </Animated.View>

          {PARTICLE_LAYERS.map((layer, i) => (
            <Animated.View
              key={i}
              style={{
                position: 'absolute',
                width: layerAnims[i],
                height: layerAnims[i],
                backgroundColor: layer.color,
                opacity: layer.opacity,
                borderTopLeftRadius: layer.borderTopLeftRadius,
                borderTopRightRadius: layer.borderTopRightRadius,
                borderBottomRightRadius: layer.borderBottomRightRadius,
                borderBottomLeftRadius: layer.borderBottomLeftRadius,
              }}
            />
          ))}
        </View>

        {/* Countdown */}
        <Text style={styles.countdown}>{isRunning && countdown > 0 ? String(countdown) : ' '}</Text>

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

      {/* Technique info modal */}
      <Modal
        visible={infoIdx !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoIdx(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity
              style={styles.modalClose}
              onPress={() => setInfoIdx(null)}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>

            {infoTech !== null && (
              <>
                <Text style={styles.modalTitle}>{infoTech.label}</Text>
                <Text style={styles.modalTiming}>{infoTech.timing}</Text>
                <Text style={styles.modalTagline}>{infoTech.tagline}</Text>
                <Text style={styles.modalDesc}>{infoTech.description}</Text>

                <View style={styles.modalDivider} />

                <Text style={styles.modalBestForLabel}>Best for</Text>
                {infoTech.bestFor.map((point, j) => (
                  <View key={j} style={styles.modalBulletRow}>
                    <View style={styles.modalBulletDot} />
                    <Text style={styles.modalBulletText}>{point}</Text>
                  </View>
                ))}
              </>
            )}
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
    marginBottom: 28,
  },
  techRow: {
    paddingHorizontal: 14,
    gap: 10,
  },
  techCard: {
    width: 160,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 4,
  },
  techCardActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceActive,
  },
  techCardLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  techCardLabelActive: {
    color: colors.textPrimary,
  },
  techCardTagline: {
    color: colors.accentBlue,
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 2,
  },
  techCardTiming: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1,
    opacity: 0.7,
    marginBottom: 6,
  },
  techCardDesc: {
    color: colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
    opacity: 0.5,
  },
  phaseLabel: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '300',
    letterSpacing: 4,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 16,
    height: 24,
    opacity: 0.6,
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
  // Info modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  modalClose: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalTiming: {
    color: colors.textSecondary,
    fontSize: 13,
    letterSpacing: 2,
    fontWeight: '500',
    marginBottom: 6,
    opacity: 0.7,
  },
  modalTagline: {
    color: colors.accentBlue,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    opacity: 0.8,
  },
  modalDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 18,
  },
  modalBestForLabel: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 10,
    opacity: 0.9,
  },
  modalBulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  modalBulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.accentBlue,
    opacity: 0.8,
  },
  modalBulletText: {
    color: colors.textSecondary,
    fontSize: 13,
    opacity: 0.75,
  },
});
