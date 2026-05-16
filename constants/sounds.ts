// Audio files in assets/sounds/ are gitignored and must never be committed to the repository.
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface SoundDef {
  id: string;
  name: string;
  icon: IoniconName;
  file: number | null;
  filePath?: string;
  isEmpty?: boolean;
  isUserRecording?: boolean;
  subtitle?: string;
  description?: string;
  category?: string;
}

export const SOUNDS: SoundDef[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: 'rainy-outline',
    file: require('../assets/sounds/rain.mp3'),
    category: 'nature',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: 'water-outline',
    file: require('../assets/sounds/ocean.mp3'),
    category: 'nature',
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: 'leaf-outline',
    file: require('../assets/sounds/forest.mp3'),
    category: 'nature',
  },
  {
    id: 'fire',
    name: 'Fireplace',
    icon: 'flame-outline',
    file: require('../assets/sounds/fire.mp3'),
    category: 'nature',
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: 'radio-outline',
    file: require('../assets/sounds/whitenoise.mp3'),
    category: 'nature',
  },
];
