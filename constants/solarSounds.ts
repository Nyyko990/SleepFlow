// Audio files in assets/sounds/ are gitignored and must never be committed to the repository.
import type { SoundDef } from './sounds';

export interface SolarSoundDef extends SoundDef {
  subtitle: string;
  description: string;
}

export const SOLAR_SOUNDS: SolarSoundDef[] = [
  {
    id: 'solar_hermes',
    name: 'Hermes',
    subtitle: 'Mercury',
    icon: 'flash-outline',
    file: null, // TODO: add actual audio file
    description:
      'Swift messenger of the gods, Hermes danced between worlds with winged sandals that never rested. His mind moved faster than light, weaving fate and fortune across the mortal realm. Mercury bears his name for the planet that races closest to the sun, completing its orbit in swift Hermesian time.',
  },
  {
    id: 'solar_afrodita',
    name: 'Afrodita',
    subtitle: 'Venus',
    icon: 'heart-outline',
    file: null, // TODO: add actual audio file
    description:
      "Born from sea foam and golden light, Aphrodite carried warmth wherever she walked. Her presence softened storms and turned cold stone to desire. Venus shines brightest in the sky as the goddess' eternal lantern — the first star seen at dusk and last at dawn.",
  },
  {
    id: 'solar_gaia',
    name: 'Gaia',
    subtitle: 'Earth',
    icon: 'globe-outline',
    file: null, // TODO: add actual audio file
    description:
      'The great mother who rose from Chaos, Gaia breathed forests into being and sang rivers into their courses. She carries all life upon her back with ancient, patient love. Earth takes no Olympian name — Gaia herself is our world, unchanged since the first dawn.',
  },
  {
    id: 'solar_ares',
    name: 'Ares',
    subtitle: 'Mars',
    icon: 'shield-outline',
    file: null, // TODO: add actual audio file
    description:
      "God of war and crimson battles, Ares thrummed with a power that shook mountains and silenced birds. His breath was iron, his heartbeat a war drum that never ceased. Mars gleams red in the night sky — forever stained with the god's fierce, burning will.",
  },
  {
    id: 'solar_zeus',
    name: 'Zeus',
    subtitle: 'Jupiter',
    icon: 'thunderstorm-outline',
    file: null, // TODO: add actual audio file
    description:
      'King of gods and heavens, Zeus commanded thunder with a thought and reshaped fates with a word. His presence filled the sky like a held breath before lightning. Jupiter, the largest world, bends the orbits of its neighbors to its will — a fitting throne for the king of Olympus.',
  },
  {
    id: 'solar_cronos',
    name: 'Cronos',
    subtitle: 'Saturn',
    icon: 'time-outline',
    file: null, // TODO: add actual audio file
    description:
      "Ancient father of the gods, Cronos ruled a golden age before time held meaning. He moved slowly and deliberately, devouring what he had made to hold onto power. Saturn's rings are the remnants of that age — beautiful, cold, and impossibly old.",
  },
  {
    id: 'solar_urano',
    name: 'Urano',
    subtitle: 'Uranus',
    icon: 'planet-outline',
    file: null, // TODO: add actual audio file
    description:
      'The primordial sky god, Uranus arched over Gaia in eternal blue silence. He was the first to name the stars and breathe cold wonder into the heavens. Uranus spins tilted on its side, as though forever gazing sideways into the mysteries it helped create.',
  },
  {
    id: 'solar_poseidon',
    name: 'Poseidón',
    subtitle: 'Neptune',
    icon: 'water-outline',
    file: null, // TODO: add actual audio file
    description:
      'God of the deep ocean, Poseidon ruled the unseen abyss where light surrenders. His voice was the low groan of tectonic plates and the roar of waves against black cliffs. Neptune pulses with a blue so deep it seems to call you inward, like a god whispering from the dark.',
  },
];
