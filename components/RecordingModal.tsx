import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

type Mode = 'choose' | 'record' | 'preview';

interface Props {
  visible: boolean;
  existingCount: number;
  onSave: (name: string, uri: string) => void;
  onClose: () => void;
}

function formatDuration(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function RecordingModal({ visible, existingCount, onSave, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('choose');
  const [duration, setDuration] = useState(0);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [name, setName] = useState('');

  const recordingRef = useRef<Audio.Recording | null>(null);
  const previewSoundRef = useRef<Audio.Sound | null>(null);
  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setMode('choose');
      setDuration(0);
      setPreviewUri(null);
      setIsPreviewPlaying(false);
      setName(`My Sound ${existingCount + 1}`);
      backdropAnim.setValue(0);
      scaleAnim.setValue(0.9);
      Animated.parallel([
        Animated.timing(backdropAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 90, friction: 9, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, existingCount, backdropAnim, scaleAnim]);

  const stopDurationTimer = () => {
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
  };

  const stopPreviewSound = async () => {
    const sound = previewSoundRef.current;
    if (sound) {
      previewSoundRef.current = null;
      await sound.stopAsync().catch(() => {});
      await sound.unloadAsync().catch(() => {});
    }
    setIsPreviewPlaying(false);
  };

  const stopRecordingObj = async () => {
    const rec = recordingRef.current;
    if (rec) {
      recordingRef.current = null;
      try {
        await rec.stopAndUnloadAsync();
      } catch {}
    }
  };

  const handleClose = async () => {
    stopDurationTimer();
    await stopRecordingObj();
    await stopPreviewSound();
    // Clean up temp recording file on close without saving
    if (previewUri && mode === 'preview') {
      FileSystem.deleteAsync(previewUri, { idempotent: true }).catch(() => {});
    }
    await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
    setMode('choose');
    setDuration(0);
    setPreviewUri(null);
    onClose();
  };

  const startRecording = async () => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert(
          'Microphone Access',
          'Please allow microphone access in your device settings to record your own sounds.',
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setDuration(0);
      setMode('record');

      durationTimerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.warn('[SleepFlow] Recording error:', err);
      Alert.alert('Error', 'Could not start recording. Please try again.');
    }
  };

  const stopRecording = async () => {
    stopDurationTimer();
    const rec = recordingRef.current;
    if (!rec) return;
    recordingRef.current = null;
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      if (uri) {
        setPreviewUri(uri);
        setMode('preview');
      }
    } catch (err) {
      console.warn('[SleepFlow] Stop recording error:', err);
    }
  };

  const togglePreview = async () => {
    if (!previewUri) return;

    if (isPreviewPlaying) {
      await previewSoundRef.current?.pauseAsync();
      setIsPreviewPlaying(false);
    } else if (previewSoundRef.current) {
      await previewSoundRef.current.playAsync();
      setIsPreviewPlaying(true);
    } else {
      const { sound } = await Audio.Sound.createAsync({ uri: previewUri }, { shouldPlay: true });
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPreviewPlaying(false);
        }
      });
      previewSoundRef.current = sound;
      setIsPreviewPlaying(true);
    }
  };

  const handleDiscard = async () => {
    await stopPreviewSound();
    if (previewUri) {
      FileSystem.deleteAsync(previewUri, { idempotent: true }).catch(() => {});
    }
    setPreviewUri(null);
    setDuration(0);
    setMode('choose');
  };

  const handleSave = async () => {
    if (!previewUri || !name.trim()) return;
    await stopPreviewSound();
    const savedName = name.trim();
    const savedUri = previewUri;
    setPreviewUri(null);
    setMode('choose');
    onSave(savedName, savedUri);
    onClose();
  };

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setPreviewUri(asset.uri);
        // Prefill name from filename (strip extension)
        const rawName = asset.name ?? `My Sound ${existingCount + 1}`;
        setName(rawName.replace(/\.[^.]+$/, ''));
        setMode('preview');
      }
    } catch (err) {
      console.warn('[SleepFlow] Import error:', err);
      Alert.alert('Error', 'Could not import audio file. Please try again.');
    }
  };

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View style={[styles.backdrop, { opacity: backdropAnim }]} />
      </Pressable>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, { opacity: backdropAnim, transform: [{ scale: scaleAnim }] }]}
        >
          <TouchableOpacity style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {mode === 'choose' && (
            <View style={styles.content}>
              <Text style={styles.title}>Add Sound</Text>
              <TouchableOpacity style={styles.optionBtn} onPress={startRecording} activeOpacity={0.8}>
                <Ionicons name="mic-outline" size={24} color={colors.accentBlue} />
                <Text style={styles.optionText}>Record</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.optionBtn} onPress={handleImport} activeOpacity={0.8}>
                <Ionicons name="folder-open-outline" size={24} color={colors.accentBlue} />
                <Text style={styles.optionText}>Import File</Text>
              </TouchableOpacity>
            </View>
          )}

          {mode === 'record' && (
            <View style={styles.content}>
              <Text style={styles.timer}>{formatDuration(duration)}</Text>
              <View style={styles.recordingBadge}>
                <Ionicons name="radio-button-on" size={14} color="#FF3B30" />
                <Text style={styles.recordingLabel}>Recording</Text>
              </View>
              <TouchableOpacity style={styles.stopBtn} onPress={stopRecording} activeOpacity={0.8}>
                <View style={styles.stopIcon} />
              </TouchableOpacity>
              <Text style={styles.hint}>Tap the square to stop</Text>
            </View>
          )}

          {mode === 'preview' && (
            <View style={styles.content}>
              <Text style={styles.title}>Preview & Save</Text>
              <TouchableOpacity onPress={togglePreview} style={styles.playPreviewBtn} activeOpacity={0.75}>
                <Ionicons
                  name={isPreviewPlaying ? 'pause-circle' : 'play-circle'}
                  size={68}
                  color={colors.accentBlue}
                />
              </TouchableOpacity>
              <TextInput
                style={styles.nameInput}
                value={name}
                onChangeText={setName}
                placeholder="Sound name..."
                placeholderTextColor={colors.textSecondary}
                maxLength={30}
                selectTextOnFocus
              />
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard} activeOpacity={0.8}>
                  <Text style={styles.discardText}>Discard</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.78)',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: 280,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingTop: 48,
    paddingBottom: 32,
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
    width: '100%',
    alignItems: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
  },
  optionText: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  timer: {
    color: colors.textPrimary,
    fontSize: 44,
    fontWeight: '200',
    letterSpacing: 2,
    marginBottom: 16,
    fontVariant: ['tabular-nums'],
  },
  recordingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 28,
  },
  recordingLabel: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '500',
  },
  stopBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  stopIcon: {
    width: 24,
    height: 24,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  hint: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  playPreviewBtn: {
    marginBottom: 20,
  },
  nameInput: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  discardBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  discardText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.accentBlue,
    alignItems: 'center',
  },
  saveText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
});
