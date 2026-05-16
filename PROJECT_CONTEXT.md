# PROJECT_CONTEXT.md

## App Overview

**SleepFlow** is a sleep and wellness companion app for iOS and Android. The core philosophy is minimalist, dark, and calming — every interaction should feel quiet and intentional. The UI is deep navy/black with soft glows, and all audio fades gently in and out rather than snapping.

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | React Native | 0.81.5 |
| Framework | React | 19.1.0 |
| Build system | Expo (managed workflow) | ~54.0.x |
| Routing | Expo Router (file-based) | ~6.0.23 |
| Language | TypeScript (strict) | ~5.9.x |
| Audio playback | expo-audio | ^55.0.x |
| Audio recording | expo-audio (useAudioRecorder) | ^55.0.x |
| File system | expo-file-system/legacy | ~19.0.x |
| Document import | expo-document-picker | ~14.0.x |
| Storage | @react-native-async-storage/async-storage | ~2.2.x |
| Sliders | @react-native-community/slider | ^5.0.x |
| Animations | react-native-reanimated v4 + react-native-worklets | ~4.1.x / ^0.5.1 |
| Notifications | expo-notifications (not yet wired) | ~0.32.x |
| Ads (future) | react-native-google-mobile-ads | ~14.0.x |
| IAP (future) | react-native-iap | ~12.15.x |

## Folder Structure

```
app/                    # Expo Router screens (file = route)
  _layout.tsx           # Root stack navigator
  index.tsx             # Home screen (/)
  solar-system.tsx      # Solar System bundle (/solar-system)
  breathe.tsx           # Stub screen (/breathe)
  stories.tsx           # Stub screen (/stories)
  timer.tsx             # Stub screen (/timer)

components/
  SoundCard.tsx         # Memo-wrapped grid tile with slider
  SoundModal.tsx        # Full-screen detail overlay
  RecordingModal.tsx    # Record / Import / Preview / Save flow
  FeaturedBanner.tsx    # Tappable banner linking to solar-system
  LoadingScreen.tsx     # Animated splash (stars, moon, clouds)
  BottomNav.tsx         # Persistent 4-tab navigation bar

hooks/
  useSoundPlayer.ts     # Playback for bundled sounds (SoundDef[])
  useRecordingPlayer.ts # Playback + management for user recordings

constants/
  colors.ts             # Single source of truth for all theme colors
  sounds.ts             # SOUNDS array (built-in nature sounds) + SoundDef type
  solarSounds.ts        # SOLAR_SOUNDS array (8 planets, file: null)

assets/
  sounds/               # MP3 files — NOT committed to git (see .gitignore)
```

## Key Dependencies — Why Each Exists

- **expo-audio**: Replaced expo-av (SDK 54+). Provides `createAudioPlayer` for imperative looping ambient playback, `useAudioRecorder` for mic capture. Volume is a synchronous property setter (`player.volume = 0.5`), not an async method.
- **expo-file-system/legacy**: Import path MUST be `expo-file-system/legacy` — the v19 default export is a new class-based API that does not expose `documentDirectory`, `copyAsync`, etc.
- **react-native-worklets pinned to 0.5.1**: Required peer dep for reanimated v4. Must stay explicit in `dependencies` or the build breaks.
- **expo-linking pinned to ^55.0.15**: Known version conflict with expo-router@6.0.23. Always use `npm install --legacy-peer-deps`.

## Features by Phase

### Phase 0 — Foundation
- Expo project scaffold with TypeScript strict mode
- Expo Router file-based navigation
- Dark theme color system (`constants/colors.ts`)
- Dependency conflict resolution (expo-linking, worklets)

### Phase 1.1 — Audio Mixer
- Built-in sound grid (Rain, Ocean, Forest, Fireplace, White Noise)
- Per-sound volume sliders with AsyncStorage persistence
- Fade in (1500ms) / fade out (1000ms) via setInterval
- Looping background audio, plays in silent mode

### Phase 1.2 — UI Redesign
- LoadingScreen with animated stars, constellation, clouds, moon
- FeaturedBanner linking to Solar System
- Filter pills (All / Nature / Space / Personal)
- BottomNav with 4 tabs (stub screens for Breathe, Stories, Timer)

### Phase 1.3 — Sound Bundles + Recording
- Solar System screen (8 planets, Greek mythology descriptions)
- RecordingModal: mic recording + file import + preview + save
- useRecordingPlayer hook with full CRUD (add, delete, persist)
- Recordings stored in `FileSystem.documentDirectory/recordings/`

### Phase 1.3.5 — UI Overhaul
- SoundModal with left/right navigation, mythology info panel
- SoundCard long-press to open modal, subtitle display
- Trash button in modal for user recordings

### Phase 1.4 (upcoming) — Breathing Exercises
### Phase 1.5 (upcoming) — Sleep Stories
### Phase 2 (upcoming) — Sleep Timer
### Phase 4 (upcoming) — Monetization (AdMob + IAP)

## Branch Strategy

- `main` — stable releases only
- `develop` — integration branch; all PRs target `develop`
- `feature/*` — cut from `develop`, merged back to `develop`

## Rules for Claude

1. **Never hardcode hex values** in component files — always use tokens from `constants/colors.ts`.
2. **Always use `npm install --legacy-peer-deps`** — standard `npm install` and `npx expo install` break due to the expo-linking conflict.
3. **MP3/audio files are never committed** — they live in `assets/sounds/` which is gitignored.
4. **Import FileSystem from `expo-file-system/legacy`** — not the default export.
5. **All new screens** must include `<BottomNav />` and use `useSafeAreaInsets` for top padding.
6. **SoundDef arrays passed to useSoundPlayer must be stable module-level constants** — the array is captured in a useRef at mount; inline literals will break the hook.
7. **StyleSheet.create for all styles** — no inline style objects.
8. **New files must be `.tsx` or `.ts`** — strict TypeScript throughout.
9. **Never modify `App.js` or `index.js`** — they are legacy stubs; entry point is `expo-router/entry`.
10. **Keep `react-native-worklets` explicit in `dependencies`** at v0.5.1 — removing it breaks the reanimated build.
