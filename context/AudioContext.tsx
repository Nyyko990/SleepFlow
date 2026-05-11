import React, { createContext, useCallback, useContext, useMemo } from 'react';
import { useSoundPlayer } from '../hooks/useSoundPlayer';
import { useRecordingPlayer, type RecordingMeta } from '../hooks/useRecordingPlayer';
import { SOUNDS, type SoundDef } from '../constants/sounds';

interface AudioContextValue {
  allSounds: SoundDef[];
  allActive: Record<string, boolean>;
  allVolumes: Record<string, number>;
  handleToggle: (id: string) => void;
  handleSetVolume: (id: string, v: number) => void;
  isReady: boolean;
  recordings: RecordingMeta[];
  recSoundDefs: SoundDef[];
  addRecording: (name: string, uri: string) => Promise<void>;
  deleteRecording: (id: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const { active, volumes, toggle, setVolume, isReady } = useSoundPlayer(SOUNDS);
  const {
    soundDefs: recSoundDefs,
    recordings,
    active: recActive,
    volumes: recVolumes,
    toggle: recToggle,
    setVolume: recSetVolume,
    addRecording,
    deleteRecording,
  } = useRecordingPlayer();

  const allSounds = useMemo(() => [...SOUNDS, ...recSoundDefs], [recSoundDefs]);
  const allActive = useMemo(() => ({ ...active, ...recActive }), [active, recActive]);
  const allVolumes = useMemo(() => ({ ...volumes, ...recVolumes }), [volumes, recVolumes]);

  const handleToggle = useCallback(
    (id: string) => {
      if (recActive[id] !== undefined) recToggle(id);
      else toggle(id);
    },
    [recActive, recToggle, toggle],
  );

  const handleSetVolume = useCallback(
    (id: string, v: number) => {
      if (recVolumes[id] !== undefined) recSetVolume(id, v);
      else setVolume(id, v);
    },
    [recVolumes, recSetVolume, setVolume],
  );

  const value = useMemo(
    () => ({
      allSounds,
      allActive,
      allVolumes,
      handleToggle,
      handleSetVolume,
      isReady,
      recordings,
      recSoundDefs,
      addRecording,
      deleteRecording,
    }),
    [
      allSounds,
      allActive,
      allVolumes,
      handleToggle,
      handleSetVolume,
      isReady,
      recordings,
      recSoundDefs,
      addRecording,
      deleteRecording,
    ],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio must be used within AudioProvider');
  return ctx;
}
