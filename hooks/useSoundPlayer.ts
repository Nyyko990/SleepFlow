import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SoundDef } from '../constants/sounds';

const VOL_KEY = 'sf_vol_';
const DEFAULT_VOL = 0.7;
const FADE_IN_MS = 1500;
const FADE_OUT_MS = 1000;
const FADE_STEPS = 30;

export function useSoundPlayer(sounds: SoundDef[]) {
  // Captured once at mount — sounds should always be a stable module-level constant
  const playableRef = useRef<SoundDef[]>(sounds.filter(s => !s.isEmpty));
  const PLAYABLE = playableRef.current;

  const soundRefs = useRef<Record<string, Audio.Sound | null>>({});
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval> | null>>({});

  const [active, setActive] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PLAYABLE.map(s => [s.id, false]))
  );
  const [volumes, setVolumes] = useState<Record<string, number>>(
    () => Object.fromEntries(PLAYABLE.map(s => [s.id, DEFAULT_VOL]))
  );
  const [loadedCount, setLoadedCount] = useState(0);

  const isReady = loadedCount >= PLAYABLE.length;

  const activeRef = useRef(active);
  const volumesRef = useRef(volumes);
  activeRef.current = active;
  volumesRef.current = volumes;

  useEffect(() => {
    let alive = true;

    (async () => {
      await Audio.setAudioModeAsync({
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        allowsRecordingIOS: false,
        shouldDuckAndroid: false,
        playThroughEarpieceAndroid: false,
      });

      const volEntries = await Promise.all(
        PLAYABLE.map(async s => {
          const raw = await AsyncStorage.getItem(VOL_KEY + s.id);
          return [s.id, raw !== null ? parseFloat(raw) : DEFAULT_VOL] as [string, number];
        })
      );
      if (alive) setVolumes(Object.fromEntries(volEntries));

      await Promise.all(
        PLAYABLE.map(async s => {
          if (!s.file) {
            if (alive) setLoadedCount(c => c + 1);
            return;
          }
          try {
            const { sound } = await Audio.Sound.createAsync(s.file, {
              isLooping: true,
              volume: 0,
              shouldPlay: false,
            });
            if (alive) {
              soundRefs.current[s.id] = sound;
            } else {
              sound.unloadAsync();
            }
          } catch (err) {
            console.warn(`[SleepFlow] Failed to load "${s.id}":`, err);
          }
          if (alive) setLoadedCount(c => c + 1);
        })
      );
    })();

    return () => {
      alive = false;
      Object.values(timerRefs.current).forEach(t => t && clearInterval(t));
      Object.values(soundRefs.current).forEach(s => s?.unloadAsync());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const clearTimer = useCallback((id: string) => {
    if (timerRefs.current[id]) {
      clearInterval(timerRefs.current[id]!);
      timerRefs.current[id] = null;
    }
  }, []);

  const toggle = useCallback((id: string) => {
    const wasActive = activeRef.current[id];
    const targetVol = volumesRef.current[id] ?? DEFAULT_VOL;
    const sound = soundRefs.current[id];

    setActive(prev => ({ ...prev, [id]: !wasActive }));
    clearTimer(id);

    if (!sound) return;

    if (!wasActive) {
      sound.setVolumeAsync(0);
      sound.playAsync();
      let step = 0;
      timerRefs.current[id] = setInterval(async () => {
        step++;
        await sound.setVolumeAsync(Math.min((step / FADE_STEPS) * targetVol, targetVol));
        if (step >= FADE_STEPS) clearTimer(id);
      }, FADE_IN_MS / FADE_STEPS);
    } else {
      sound.getStatusAsync().then(status => {
        if (!status.isLoaded) return;
        const fromVol = status.volume;
        let step = 0;
        timerRefs.current[id] = setInterval(async () => {
          step++;
          const vol = Math.max(fromVol * (1 - step / FADE_STEPS), 0);
          await sound.setVolumeAsync(vol);
          if (step >= FADE_STEPS) {
            clearTimer(id);
            sound.stopAsync();
          }
        }, FADE_OUT_MS / FADE_STEPS);
      });
    }
  }, [clearTimer]);

  const setVolume = useCallback((id: string, vol: number) => {
    clearTimer(id);
    setVolumes(prev => ({ ...prev, [id]: vol }));
    AsyncStorage.setItem(VOL_KEY + id, String(vol));
    if (activeRef.current[id]) {
      soundRefs.current[id]?.setVolumeAsync(vol);
    }
  }, [clearTimer]);

  return { active, volumes, toggle, setVolume, isReady };
}
