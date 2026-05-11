# FEATURE_LOG.md

Tracks every feature shipped in SleepFlow, phase by phase.

## Completed

| Phase | Feature | Status | Notes |
|---|---|---|---|
| 0.1 | Expo managed project scaffold | ✅ Done | React 19, RN 0.81, Expo 54, TypeScript strict |
| 0.2 | Expo Router file-based navigation | ✅ Done | `app/` directory, Stack navigator, `headerShown: false` |
| 0.3 | Dark theme color system | ✅ Done | `constants/colors.ts` — all tokens centralised |
| 0.4 | Dependency conflict resolution | ✅ Done | expo-linking conflict fixed, worklets pinned to 0.5.1 |
| 1.1 | Audio mixer — built-in sounds | ✅ Done | Rain, Ocean, Forest, Fireplace, White Noise |
| 1.1 | Per-sound volume sliders | ✅ Done | `@react-native-community/slider`, persisted via AsyncStorage |
| 1.1 | Fade in / fade out | ✅ Done | setInterval, 30 steps, 1500ms in / 1000ms out |
| 1.1 | Background audio + silent mode | ✅ Done | `setAudioModeAsync` — plays through silent switch on iOS |
| 1.1 | Sound grid with 3-column FlatList | ✅ Done | `buildGridData` pads to multiple of 3 with spacers |
| 1.2 | LoadingScreen animated splash | ✅ Done | Stars, constellation, cloud parallax, moon pulse |
| 1.2 | FeaturedBanner | ✅ Done | Tappable card → Solar System screen |
| 1.2 | Filter pills | ✅ Done | All / Nature / Space (nav) / Personal |
| 1.2 | BottomNav with 4 tabs | ✅ Done | Sounds, Breathe (stub), Stories (stub), Timer (stub) |
| 1.3 | Solar System screen | ✅ Done | 8 planets, Greek mythology, `file: null` placeholders |
| 1.3 | SoundModal with mythology info | ✅ Done | Left/right nav, info panel with opacity animation |
| 1.3 | RecordingModal — mic recording | ✅ Done | Permissions, timer, stop, preview, name, save |
| 1.3 | RecordingModal — file import | ✅ Done | `expo-document-picker`, prefill name from filename |
| 1.3 | useRecordingPlayer hook | ✅ Done | Full CRUD: add, load, toggle, volume, delete |
| 1.3 | Recording file persistence | ✅ Done | Copied to `documentDirectory/recordings/`, AsyncStorage metadata |
| 1.3.5 | UI redesign — SoundCard subtitle | ✅ Done | Subtitle rendered below name |
| 1.3.5 | SoundModal trash button | ✅ Done | Shown only for `isUserRecording`, calls `onDelete` + `onClose` |
| 1.3.5 | SoundDef category field | ✅ Done | `category?: string` — used for future filter refinement |
| 1.x | Migrate expo-av → expo-audio | ✅ Done | `createAudioPlayer`, `useAudioRecorder` — synchronous volume API |
| 1.x | Input validation (security) | ✅ Done | Max 50 chars for names, audio extension whitelist on import |

## Upcoming

| Phase | Feature | Status | Notes |
|---|---|---|---|
| 1.4 | Breathing exercises screen | 🔜 Planned | Implement inside `app/breathe.tsx` stub |
| 1.4 | Breathing animation | 🔜 Planned | Inhale / hold / exhale cycle with visual guide |
| 1.5 | Sleep stories screen | 🔜 Planned | Implement inside `app/stories.tsx` stub |
| 1.5 | Story audio player | 🔜 Planned | Single-track player with progress bar |
| 2.0 | Sleep timer | 🔜 Planned | `timerArea` View in `app/index.tsx` is the reserved hook point |
| 2.0 | Timer fade-out | 🔜 Planned | Gradually silence all active sounds when timer expires |
| 4.0 | AdMob banner ads | 🔜 Planned | `react-native-google-mobile-ads` already installed |
| 4.0 | In-app purchases | 🔜 Planned | `react-native-iap` already installed; unlock premium sounds |
| — | Real Solar System audio files | 🔜 Planned | All 8 SOLAR_SOUNDS have `file: null`; add MP3s when ready |
| — | Push notifications | 🔜 Planned | `expo-notifications` installed but not wired up |
