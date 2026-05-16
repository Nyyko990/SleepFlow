import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors } from '../constants/colors';
import type { SoundDef } from '../constants/sounds';

interface Props {
  sounds: SoundDef[];
  expandedId: string | null;
  active: Record<string, boolean>;
  volumes: Record<string, number>;
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

export function SoundModal({
  sounds,
  expandedId,
  active,
  volumes,
  onToggle,
  onVolumeChange,
  onClose,
  onDelete,
}: Props) {
  const [mountedId, setMountedId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const infoOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (expandedId !== null) {
      setMountedId(expandedId);
      setCurrentId(expandedId);
      setShowInfo(false);
      contentOpacity.setValue(1);
      infoOpacity.setValue(0);
      backdropAnim.setValue(0);
      scaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 90, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      setShowInfo(false);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 180, useNativeDriver: true }),
      ]).start(() => setMountedId(null));
    }
  }, [expandedId, backdropAnim, scaleAnim, contentOpacity, infoOpacity]);

  const navigate = (dir: 1 | -1) => {
    if (!currentId) return;
    const idx = sounds.findIndex(s => s.id === currentId);
    const next = sounds[(idx + dir + sounds.length) % sounds.length];
    setShowInfo(false);
    Animated.timing(contentOpacity, { toValue: 0, duration: 110, useNativeDriver: true }).start(
      () => {
        setCurrentId(next.id);
        infoOpacity.setValue(0);
        Animated.timing(contentOpacity, { toValue: 1, duration: 170, useNativeDriver: true }).start();
      },
    );
  };

  const toggleInfo = () => {
    const next = !showInfo;
    setShowInfo(next);
    Animated.timing(infoOpacity, { toValue: next ? 1 : 0, duration: 220, useNativeDriver: true }).start();
  };

  const handleDelete = () => {
    if (!currentId || !onDelete) return;
    onDelete(currentId);
    onClose();
  };

  if (mountedId === null || currentId === null) return null;

  const sound = sounds.find(s => s.id === currentId);
  if (!sound) return null;

  const isActive = active[currentId] ?? false;
  const volume = volumes[currentId] ?? 0.7;
  const hasInfo = Boolean(sound.description);

  const displaySubtitle =
    sound.subtitle ?? (sound.isUserRecording ? 'Personal recording' : 'Nature sound');

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]} />
      </Pressable>

      <View style={styles.row} pointerEvents="box-none">
        <TouchableOpacity style={styles.navBtn} onPress={() => navigate(-1)} hitSlop={16}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>

        <Animated.View
          style={[styles.card, { opacity: backdropAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {hasInfo && (
            <TouchableOpacity style={styles.infoBtn} onPress={toggleInfo} hitSlop={12}>
              <Ionicons
                name={showInfo ? 'information-circle' : 'information-circle-outline'}
                size={20}
                color={showInfo ? colors.accentBlue : colors.textSecondary}
              />
            </TouchableOpacity>
          )}

          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <Ionicons
              name={sound.icon}
              size={40}
              color={isActive ? colors.accentBlue : colors.textSecondary}
              style={styles.soundIcon}
            />
            <Text style={[styles.soundName, isActive && styles.soundNameActive]}>
              {sound.name}
            </Text>
            <Text style={styles.soundSubtitle}>{displaySubtitle}</Text>

            {hasInfo && showInfo ? (
              <Animated.View style={[styles.infoCard, { opacity: infoOpacity }]}>
                <ScrollView
                  style={styles.infoScroll}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled
                >
                  <Text style={styles.infoText}>{sound.description}</Text>
                </ScrollView>
              </Animated.View>
            ) : (
              <>
                <TouchableOpacity
                  onPress={() => onToggle(currentId)}
                  activeOpacity={0.75}
                  style={styles.playBtn}
                >
                  <View style={[styles.playCircle, isActive && styles.playCircleActive]}>
                    <Ionicons
                      name={isActive ? 'pause' : 'play'}
                      size={32}
                      color={colors.textPrimary}
                      style={isActive ? undefined : styles.playIconOffset}
                    />
                  </View>
                </TouchableOpacity>

                <View onStartShouldSetResponder={() => true} style={styles.sliderRow}>
                  <Ionicons name="volume-low-outline" size={15} color={colors.textSecondary} />
                  <Slider
                    style={styles.slider}
                    value={volume}
                    minimumValue={0}
                    maximumValue={1}
                    step={0.01}
                    onValueChange={v => onVolumeChange(currentId, v)}
                    minimumTrackTintColor={isActive ? colors.accentBlue : colors.border}
                    maximumTrackTintColor={colors.border}
                    thumbTintColor={isActive ? colors.accentBlue : colors.textSecondary}
                  />
                  <Ionicons name="volume-high-outline" size={15} color={colors.textSecondary} />
                </View>
              </>
            )}

            {sound.isUserRecording && onDelete ? (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} hitSlop={8}>
                <Ionicons name="trash-outline" size={16} color="#FF453A" />
                <Text style={styles.deleteText}>Delete</Text>
              </TouchableOpacity>
            ) : null}
          </Animated.View>
        </Animated.View>

        <TouchableOpacity style={styles.navBtn} onPress={() => navigate(1)} hitSlop={16}>
          <Ionicons name="chevron-forward-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.82)',
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtn: {
    padding: 12,
  },
  card: {
    width: 290,
    backgroundColor: colors.surface,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 28,
    alignItems: 'center',
    shadowColor: colors.accentBlue,
    shadowOpacity: 0.15,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  closeBtn: {
    position: 'absolute',
    top: 16,
    right: 18,
    padding: 4,
  },
  infoBtn: {
    position: 'absolute',
    top: 16,
    left: 18,
    padding: 4,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  soundIcon: {
    marginBottom: 12,
  },
  soundName: {
    color: colors.textSecondary,
    fontSize: 24,
    fontWeight: '500',
    marginBottom: 4,
    textAlign: 'center',
  },
  soundNameActive: {
    color: colors.textPrimary,
  },
  soundSubtitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 20,
    opacity: 0.6,
    textAlign: 'center',
  },
  playBtn: {
    marginBottom: 24,
  },
  playCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accentPurple,
    borderWidth: 1.5,
    borderColor: colors.accentBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircleActive: {
    backgroundColor: colors.surfaceActive,
    shadowColor: colors.accentBlue,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  playIconOffset: {
    marginLeft: 4,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 6,
  },
  slider: {
    flex: 1,
    height: 32,
  },
  infoCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 14,
    marginTop: 4,
    marginBottom: 8,
    maxHeight: 160,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoScroll: {
    flexGrow: 0,
  },
  infoText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 18,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF453A33',
  },
  deleteText: {
    color: '#FF453A',
    fontSize: 12,
    fontWeight: '500',
  },
});
