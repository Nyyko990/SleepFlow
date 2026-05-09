# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start               # Start dev server (scan QR with Expo Go)
npm run android         # Start with Android target
npm run ios             # Start with iOS target
npm run web             # Start with web target
npx expo start --clear  # Clear Metro bundler cache (use when modules behave strangely)
```

No test suite is configured yet.

## Architecture

**SleepFlow** is an Expo-managed React Native sleep/wellness app (React 19, RN 0.81, Expo 54) targeting iOS, Android, and Web.

### Routing

Uses **Expo Router** (file-based routing inside `app/`). `app/_layout.tsx` is the root Stack navigator with `headerShown: false` and `StatusBar style="light"` (white icons on dark background). `app/index.tsx` is the `/` home screen. New screens go in `app/` as files or nested folders.

`App.js` and `index.js` exist as legacy stubs — the actual app entry is `expo-router/entry` (set in `package.json` `main`). Do not modify these stubs.

The app deep-link scheme is `sleepflow` (configured in `app.json`).

### Branch strategy

- `main` — stable releases
- `develop` — integration branch; PRs target `develop`, not `main`
- `feature/*` — feature branches cut from `develop`

### Key dependencies

| Package | Purpose |
|---|---|
| `expo-av` | Audio playback — sound files live in `assets/sounds/` |
| `@react-native-community/slider` | Volume slider in `SoundCard` |
| `expo-notifications` | Push/local notifications |
| `@react-native-async-storage/async-storage` | Local persistence — used to save per-sound volumes across sessions |
| `react-native-reanimated` v4 | Animations — Babel plugin registered in `babel.config.js` |
| `react-native-worklets` | Required peer dep for reanimated v4 — pinned to v0.5.1 for Expo SDK 54 compatibility; must stay explicit in `dependencies` |
| `expo-linking` | Deep-link URL parsing — required by Expo Router |
| `react-native-safe-area-context` | Safe area insets — required for Android edge-to-edge (`edgeToEdgeEnabled: true`) |
| `react-native-screens` | Native navigation primitives — required by Expo Router |
| `react-native-google-mobile-ads` | AdMob ads |
| `react-native-iap` | In-app purchases |

### Theme

All colors live in `constants/colors.ts` and are consumed via named tokens:

| Token | Hex | Usage |
|---|---|---|
| `colors.background` | `#0A0A0F` | Screen backgrounds |
| `colors.surface` | `#0D0D1A` | Card/panel surfaces |
| `colors.surfaceActive` | `#0F1121` | Active/selected card state |
| `colors.accentBlue` | `#2D5986` | Primary accent |
| `colors.accentPurple` | `#2D1B4E` | Secondary accent |
| `colors.textPrimary` | `#E8E8F0` | Main text |
| `colors.textSecondary` | `#8888A0` | Muted/secondary text |
| `colors.border` | `#1A1A2E` | Dividers and borders |

The app enforces dark theme (`userInterfaceStyle: "dark"` in `app.json`). Always import from `constants/colors` — never hardcode hex values in component files.

### Sound mixer

The sound mixer is the core Phase 1 feature. Data flows: `constants/sounds.ts` → `hooks/useSoundPlayer.ts` → `app/index.tsx` → `components/SoundCard.tsx`.

- **`constants/sounds.ts`** — `SOUNDS: SoundDef[]` is the single source of truth for available sounds. Each entry has `id`, `name`, `icon` (Ionicons name), and `file` (Metro asset `require`). Entries with `isEmpty: true` are grid spacers with no playback logic; filter them out with `s.isEmpty` before processing.
- **`hooks/useSoundPlayer.ts`** — manages `expo-av` `Audio.Sound` instances (preloaded at mount, looping). Exposes `{ active, volumes, toggle, setVolume }`. `toggle` fades in/out over ~1.5 s / 1 s using `setInterval`. Per-sound volumes are persisted to AsyncStorage under the key `sf_vol_<id>` and restored on mount. Cancels any running fade when the user manually drags the slider.
- **`components/SoundCard.tsx`** — `memo`-wrapped card; wraps `<Slider>` in a `<View onStartShouldSetResponder>` to prevent slider drag events from bubbling up to the card's `onPress` toggle. Tap = toggle playback; long-press = open `SoundModal`.
- **`components/SoundModal.tsx`** — full-screen overlay opened via long-press on a `SoundCard`. Shows icon, name, large play/pause button, and volume slider. Uses `mountedId` (lags behind `expandedId`) so content stays visible during the close animation. Animated with a backdrop fade + spring scale.
- **`components/LoadingScreen.tsx`** — absolute-fill splash shown while `useSoundPlayer` preloads sounds (`isReady === false`). Fades out over 600 ms once ready. Uses staggered `Animated.loop` dots.

`useSoundPlayer` exposes `{ active, volumes, toggle, setVolume, isReady }`. `isReady` turns `true` once all `Audio.Sound` instances finish preloading; the home screen uses it to trigger the loading fade-out.

The home screen (`app/index.tsx`) reserves a `timerArea` View at the bottom for the Phase 2 sleep timer — it is intentionally empty.

### New Architecture

`newArchEnabled: true` is set in `app.json`. Any new native modules must support the React Native New Architecture (Fabric/TurboModules). Android also has `edgeToEdgeEnabled: true` — account for system bar insets when building Android UI.

### TypeScript

`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`. All new files should be `.tsx`/`.ts`.

### Conventions

- Use `StyleSheet.create` for all styles — no inline style objects.
- Screen components are default exports; helper/UI components are named exports.
- Orientation is locked to portrait (`app.json`).
