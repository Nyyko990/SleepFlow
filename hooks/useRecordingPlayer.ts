import { useCallback, useEffect, useRef, useState } from 'react';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';
import type { SoundDef } from '../constants/sounds';

const RECORDINGS_KEY = 'user_recordings';
const VOL_KEY = 'sf_vol_';
const DEFAULT_VOL = 0.7;
const FADE_IN_MS = 1500;
const FADE_OUT_MS = 1000;
const FADE_STEPS = 30;

export interface RecordingMeta {
  id: string;
  name: string;
  filePath: string;
  createdAt: string;
}

export function useRecordingPlayer() {
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const recordingsRef = useRef<RecordingMeta[]>([]);

  const soundRefs = useRef<Record<string, Audio.Sound | null>>({});
  const timerRefs = useRef<Record<string, ReturnType<typeof setInterval> | null>>({});

  const [active, setActive] = useState<Record<string, boolean>>({});
  const [volumes, setVolumes] = useState<Record<string, number>>({});

  const activeRef = useRef<Record<string, boolean>>({});
  const volumesRef = useRef<Record<string, number>>({});
  activeRef.current = active;
  volumesRef.current = volumes;

  const loadSoundForId = async (id: string, filePath: string) => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: filePath },
        { isLooping: true, volume: 0, shouldPlay: false },
      );
      soundRefs.current[id] = sound;
    } catch (err) {
      console.warn(`[SleepFlow] Failed to load recording "${id}":`, err);
    }
  };

  useEffect(() => {
    let alive = true;

    (async () => {
      const raw = await AsyncStorage.getItem(RECORDINGS_KEY);
      const metas: RecordingMeta[] = raw ? JSON.parse(raw) : [];

      if (!alive) return;

      recordingsRef.current = metas;
      setRecordings(metas);

      if (metas.length === 0) return;

      const volEntries = await Promise.all(
        metas.map(async m => {
          const v = await AsyncStorage.getItem(VOL_KEY + m.id);
          return [m.id, v !== null ? parseFloat(v) : DEFAULT_VOL] as [string, number];
        }),
      );

      if (!alive) return;

      setVolumes(Object.fromEntries(volEntries));
      setActive(Object.fromEntries(metas.map(m => [m.id, false])));

      await Promise.all(metas.map(m => loadSoundForId(m.id, m.filePath)));
    })();

    return () => {
      alive = false;
      Object.values(timerRefs.current).forEach(t => t && clearInterval(t));
      Object.values(soundRefs.current).forEach(s => s?.unloadAsync());
    };
  }, []);

  const clearTimer = useCallback((id: string) => {
    if (timerRefs.current[id]) {
      clearInterval(timerRefs.current[id]!);
      timerRefs.current[id] = null;
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
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
    },
    [clearTimer],
  );

  const setVolume = useCallback(
    (id: string, vol: number) => {
      clearTimer(id);
      setVolumes(prev => ({ ...prev, [id]: vol }));
      AsyncStorage.setItem(VOL_KEY + id, String(vol));
      if (activeRef.current[id]) {
        soundRefs.current[id]?.setVolumeAsync(vol);
      }
    },
    [clearTimer],
  );

  const addRecording = useCallback(async (name: string, sourceUri: string) => {
    const id = `rec_${Date.now()}`;
    const dir = (FileSystem.documentDirectory ?? '') + 'recordings/';
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const ext = sourceUri.split('.').pop() ?? 'm4a';
    const destPath = dir + id + '.' + ext;
    await FileSystem.copyAsync({ from: sourceUri, to: destPath });

    const meta: RecordingMeta = {
      id,
      name,
      filePath: destPath,
      createdAt: new Date().toISOString(),
    };

    const updated = [...recordingsRef.current, meta];
    recordingsRef.current = updated;
    setRecordings(updated);
    AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));

    setVolumes(prev => ({ ...prev, [id]: DEFAULT_VOL }));
    setActive(prev => ({ ...prev, [id]: false }));
    AsyncStorage.setItem(VOL_KEY + id, String(DEFAULT_VOL));

    await loadSoundForId(id, destPath);
  }, []);

  const deleteRecording = useCallback(
    async (id: string) => {
      clearTimer(id);
      setActive(prev => ({ ...prev, [id]: false }));

      const sound = soundRefs.current[id];
      if (sound) {
        await sound.stopAsync().catch(() => {});
        await sound.unloadAsync().catch(() => {});
        delete soundRefs.current[id];
      }

      const meta = recordingsRef.current.find(r => r.id === id);
      if (meta) {
        await FileSystem.deleteAsync(meta.filePath, { idempotent: true }).catch(() => {});
      }

      await AsyncStorage.removeItem(VOL_KEY + id);

      const updated = recordingsRef.current.filter(r => r.id !== id);
      recordingsRef.current = updated;
      setRecordings(updated);
      AsyncStorage.setItem(RECORDINGS_KEY, JSON.stringify(updated));

      setVolumes(prev => {
        const { [id]: _v, ...rest } = prev;
        return rest;
      });
      setActive(prev => {
        const { [id]: _a, ...rest } = prev;
        return rest;
      });
    },
    [clearTimer],
  );

  const soundDefs: SoundDef[] = recordings.map(r => ({
    id: r.id,
    name: r.name,
    icon: 'mic-outline' as const,
    file: null,
    filePath: r.filePath,
    isUserRecording: true,
    category: 'personal',
  }));

  return { recordings, soundDefs, active, volumes, toggle, setVolume, addRecording, deleteRecording };
}
