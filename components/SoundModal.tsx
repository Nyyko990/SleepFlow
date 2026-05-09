import React, { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors } from '../constants/colors';
import { SOUNDS } from '../constants/sounds';

const PLAYABLE = SOUNDS.filter(s => !s.isEmpty);

interface Props {
  expandedId: string | null;
  active: Record<string, boolean>;
  volumes: Record<string, number>;
  onToggle: (id: string) => void;
  onVolumeChange: (id: string, v: number) => void;
  onClose: () => void;
}

export function SoundModal({ expandedId, active, volumes, onToggle, onVolumeChange, onClose }: Props) {
  const [mountedId, setMountedId] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (expandedId !== null) {
      setMountedId(expandedId);
      setCurrentId(expandedId);
      contentOpacity.setValue(1);
      backdropAnim.setValue(0);
      scaleAnim.setValue(0.88);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 90, friction: 9, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.88, duration: 180, useNativeDriver: true }),
      ]).start(() => setMountedId(null));
    }
  }, [expandedId, backdropAnim, scaleAnim, contentOpacity]);

  const navigate = (dir: 1 | -1) => {
    if (!currentId) return;
    const idx = PLAYABLE.findIndex(s => s.id === currentId);
    const next = PLAYABLE[(idx + dir + PLAYABLE.length) % PLAYABLE.length];
    Animated.timing(contentOpacity, { toValue: 0, duration: 110, useNativeDriver: true }).start(() => {
      setCurrentId(next.id);
      Animated.timing(contentOpacity, { toValue: 1, duration: 170, useNativeDriver: true }).start();
    });
  };

  if (mountedId === null || currentId === null) return null;

  const sound = PLAYABLE.find(s => s.id === currentId);
  if (!sound) return null;

  const isActive = active[currentId] ?? false;
  const volume = volumes[currentId] ?? 0.7;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropAnim }]} />
      </Pressable>

      <View style={styles.row} pointerEvents="box-none">
        <TouchableOpacity style={styles.navBtn} onPress={() => navigate(-1)} hitSlop={16}>
          <Ionicons name="chevron-back-outline" size={28} color={colors.textSecondary} />
        </TouchableOpacity>

        <Animated.View style={[styles.card, { opacity: backdropAnim, transform: [{ scale: scaleAnim }] }]}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          <Animated.View style={[styles.content, { opacity: contentOpacity }]}>
            <Ionicons
              name={sound.icon}
              size={44}
              color={isActive ? colors.accentBlue : colors.textSecondary}
              style={styles.soundIcon}
            />
            <Text style={[styles.soundName, isActive && styles.soundNameActive]}>
              {sound.name}
            </Text>
            <TouchableOpacity
              onPress={() => onToggle(currentId)}
              activeOpacity={0.75}
              style={styles.playBtn}
            >
              <Ionicons
                name={isActive ? 'pause-circle' : 'play-circle'}
                size={72}
                color={isActive ? colors.accentBlue : colors.textSecondary}
              />
            </TouchableOpacity>
            <View onStartShouldSetResponder={() => true}>
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
            </View>
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
    backgroundColor: 'rgba(0,0,0,0.78)',
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
    width: 256,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingTop: 44,
    paddingBottom: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 16,
    padding: 4,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  soundIcon: {
    marginBottom: 10,
  },
  soundName: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 20,
  },
  soundNameActive: {
    color: colors.textPrimary,
  },
  playBtn: {
    marginBottom: 20,
  },
  slider: {
    width: 200,
    height: 32,
  },
});
