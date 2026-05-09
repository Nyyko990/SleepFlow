import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';

export type IoniconName = ComponentProps<typeof Ionicons>['name'];

export interface SoundDef {
  id: string;
  name: string;
  icon: IoniconName;
  file: number | null;
  isEmpty?: boolean;
}

export const SOUNDS: SoundDef[] = [
  {
    id: 'rain',
    name: 'Rain',
    icon: 'rainy-outline',
    file: require('../assets/sounds/rain.mp3'),
  },
  {
    id: 'ocean',
    name: 'Ocean',
    icon: 'water-outline',
    file: require('../assets/sounds/ocean.mp3'),
  },
  {
    id: 'forest',
    name: 'Forest',
    icon: 'leaf-outline',
    file: require('../assets/sounds/forest.mp3'),
  },
  {
    id: 'fire',
    name: 'Fireplace',
    icon: 'flame-outline',
    file: require('../assets/sounds/fire.mp3'),
  },
  {
    id: 'whitenoise',
    name: 'White Noise',
    icon: 'radio-outline',
    file: require('../assets/sounds/whitenoise.mp3'),
  },
  {
    id: '__empty',
    name: '',
    icon: 'add-outline',
    file: null,
    isEmpty: true,
  },
];
