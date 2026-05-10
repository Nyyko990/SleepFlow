import React, { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { colors } from '../constants/colors';
import type { SoundDef } from '../constants/sounds';

interface Props {
  sound: SoundDef;
  isActive: boolean;
  volume: number;
  onToggle: () => void;
  onVolumeChange: (v: number) => void;
  onLongPress: () => void;
}

const SoundCard = memo(function SoundCard({
  sound,
  isActive,
  volume,
  onToggle,
  onVolumeChange,
  onLongPress,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      onPress={onToggle}
      onLongPress={onLongPress}
      delayLongPress={400}
      activeOpacity={0.85}
    >
      <Ionicons
        name={sound.icon}
        size={26}
        color={isActive ? colors.accentBlue : colors.textSecondary}
      />
      <Text style={[styles.name, isActive && styles.nameActive]}>{sound.name}</Text>
      {sound.subtitle ? (
        <Text style={styles.subtitle}>{sound.subtitle}</Text>
      ) : null}
      {/* Wrapped in View to prevent slider touches from propagating to card's onPress */}
      <View onStartShouldSetResponder={() => true} style={styles.sliderWrapper}>
        <Slider
          style={styles.slider}
          value={volume}
          minimumValue={0}
          maximumValue={1}
          step={0.01}
          onValueChange={onVolumeChange}
          minimumTrackTintColor={isActive ? colors.accentBlue : colors.border}
          maximumTrackTintColor={colors.border}
          thumbTintColor={isActive ? colors.accentBlue : colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
});

export default SoundCard;

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 5,
    paddingTop: 14,
    paddingBottom: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    shadowColor: colors.cardGlow,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  cardActive: {
    borderColor: colors.accentBlue,
    backgroundColor: colors.surfaceActive,
    shadowOpacity: 0.4,
  },
  name: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '400',
    marginTop: 7,
    marginBottom: 1,
    textAlign: 'center',
  },
  nameActive: {
    color: colors.textPrimary,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: '400',
    marginBottom: 1,
    textAlign: 'center',
    opacity: 0.7,
  },
  sliderWrapper: {
    width: '100%',
    alignItems: 'stretch',
  },
  slider: {
    width: '100%',
    height: 28,
  },
});
