# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start               # Start dev server (scan QR with Expo Go)
npm run android         # Start with Android target
npm run ios             # Start with iOS target
npm run web             # Start with web target
npx expo start --clear  # Clear Metro bundler cache (use when modules behave strangely)
npx tsc --noEmit        # Type-check without building
```

Installing packages: always use `npm install --legacy-peer-deps` — there is a known `expo-linking` version conflict between the root project and `expo-router@6.0.23` that prevents standard installs. `npx expo install` also hits this; fall back to `npm install <pkg> --legacy-peer-deps`.

No test suite is configured yet.

## Architecture

**SleepFlow** is an Expo-managed React Native sleep/wellness app (React 19, RN 0.81, Expo 54) targeting iOS, Android, and Web.

### Routing

Uses **Expo Router** (file-based routing inside `app/`). `app/_layout.tsx` is the root Stack navigator with `headerShown: false` and `StatusBar style="light"`. `app/index.tsx` is the home screen (`/`). `app/solar-system.tsx` is the Solar System bundle screen. New screens go in `app/` as files.

`App.js` and `index.js` are legacy stubs — do not modify them. The actual entry is `expo-router/entry` (set in `package.json` `main`).

### Branch strategy

- `main` — stable releases
- `develop` — integration branch; PRs target `develop`, not `main`
- `feature/*` — feature branches cut from `develop`

### Key dependencies

| Package | Purpose |
|---|---|
| `expo-av` | Audio playback and microphone recording |
| `expo-document-picker` | Audio file import from device |
| `expo-file-system` | File storage for user recordings — **import from `expo-file-system/legacy`**, not the main export; the v19 default export is a new class-based API that does not expose `documentDirectory`, `copyAsync`, etc. |
| `@react-native-async-storage/async-storage` | Persists per-sound volumes (`sf_vol_<id>`) and user recording metadata (`user_recordings`) |
| `@react-native-community/slider` | Volume slider in `SoundCard` and `SoundModal` |
| `expo-notifications` | Push/local notifications (not yet wired) |
| `react-native-reanimated` v4 | Animations — Babel plugin registered in `babel.config.js` |
| `react-native-worklets` | Required peer dep for reanimated v4 — pinned to v0.5.1; must stay explicit in `dependencies` |
| `react-native-safe-area-context` | Safe area insets — required for Android edge-to-edge |
| `react-native-screens` | Native navigation primitives — required by Expo Router |
| `react-native-google-mobile-ads` | AdMob (future phase) |
| `react-native-iap` | In-app purchases (future phase) |

### Theme

All colors live in `constants/colors.ts`. Never hardcode hex values in component files.

| Token | Hex | Usage |
|---|---|---|
| `colors.background` | `#0A0A0F` | Screen backgrounds |
| `colors.surface` | `#0D0D1A` | Card/panel surfaces |
| `colors.surfaceActive` | `#0F1121` | Active/selected card state |
| `colors.accentBlue` | `#2D5986` | Primary accent |
| `colors.accentPurple` | `#2D1B4E` | Secondary accent / bundle banner border |
| `colors.textPrimary` | `#E8E8F0` | Main text |
| `colors.textSecondary` | `#8888A0` | Muted/secondary text |
| `colors.border` | `#1A1A2E` | Dividers and borders |

### Sound system

Two parallel hooks manage audio — both share the same fade/volume patterns but handle different sound sources:

**`hooks/useSoundPlayer.ts`** — accepts a `SoundDef[]` parameter (stable module-level constant). Preloads `expo-av` `Audio.Sound` instances at mount (looping, volume 0). Exposes `{ active, volumes, toggle, setVolume, isReady }`. Sounds with `file: null` (e.g. Solar System placeholders) are counted as loaded immediately without creating an audio instance — `toggle` still updates active state but plays nothing. Per-sound volumes saved to AsyncStorage under `sf_vol_<id>`. Fade in/out uses `setInterval` (30 steps, 1500 ms in / 1000 ms out) — intentionally not `Animated.timing`, to keep fine-grained step control. Used by both the home screen (`SOUNDS`) and the Solar System screen (`SOLAR_SOUNDS`).

> **Critical**: the sounds array is captured in a `useRef` at mount. Passing an inline array literal causes the ref to never update and will break the hook — always pass a stable module-level constant.

**`hooks/useRecordingPlayer.ts`** — manages user recordings stored as URI-based `Audio.Sound` instances. Persists `RecordingMeta[]` (id, name, filePath, createdAt) to AsyncStorage under `user_recordings`. Files are copied to `FileSystem.documentDirectory + 'recordings/'` on save using timestamp-based IDs (`rec_${Date.now()}.m4a`). Exposes the same `{ active, volumes, toggle, setVolume }` shape plus `{ recordings, soundDefs, addRecording, deleteRecording }`. `soundDefs` is a derived `SoundDef[]` with `isUserRecording: true` and `icon: 'mic-outline'`. `deleteRecording` stops, unloads, deletes the file, and removes both the storage entry and the volume key — full cleanup in one call.

**Home screen state merge** (`app/index.tsx`): both hooks run in parallel; their `active`/`volumes` maps are spread-merged and their `toggle`/`setVolume` are dispatched to the correct hook by checking which map contains the id.

### `SoundDef` type (`constants/sounds.ts`)

```ts
interface SoundDef {
  id: string;
  name: string;
  icon: IoniconName;
  file: number | null;      // bundled Metro asset; null for placeholders/recordings
  filePath?: string;        // file URI for user recordings
  isEmpty?: boolean;        // true = invisible grid spacer, skip all logic
  isUserRecording?: boolean;
  subtitle?: string;        // shown below name in card and modal (e.g. planet name)
  description?: string;     // shown in modal info panel (e.g. mythology text)
}
```

`SOUNDS` (built-in, 5 entries) lives in `constants/sounds.ts`. `SOLAR_SOUNDS` (8 entries, all `file: null`) extends `SoundDef` with required `subtitle` and `description` — lives in `constants/solarSounds.ts`.

### Grid layout

The home screen `FlatList` (3 columns) is built from `buildGridData(allSounds)` which appends a `{ id: '__add' }` add-button item and then pads to a multiple of 3 with `isEmpty` spacers. `renderItem` switches on `item.id === '__add'` and `'isEmpty' in item` before rendering a `SoundCard`. The `FlatList` uses `ListHeaderComponent={<FeaturedBanner />}` to place the Solar System banner above the grid.

### Components

- **`SoundCard`** — `memo`-wrapped; wraps `<Slider>` in `<View onStartShouldSetResponder>` to prevent drag events from bubbling. Renders optional `subtitle` below the name. Tap = toggle, long-press (400 ms) = open modal.
- **`SoundModal`** — full-screen overlay; receives `sounds: SoundDef[]` as prop (not hardcoded). Left/right nav cycles through the list. Shows `subtitle` and an info button (ⓘ) when `description` is present — tapping reveals a scrollable mythology card with opacity animation. Shows a trash-icon delete button when `sound.isUserRecording && onDelete` is provided; calls `onDelete(id)` then `onClose()`.
- **`RecordingModal`** — `Modal`-based (not an absolute-fill overlay). Three internal modes: `choose` (Record / Import File), `record` (live 00:00 timer, red stop button), `preview` (play/pause + name `TextInput` + Save/Discard). Uses `Audio.Recording` for mic capture, `expo-document-picker` for file import. On save, delegates file copy to `useRecordingPlayer.addRecording`. On iOS, `Audio.Recording.getURI()` returns a temporary URI that's invalidated after the recording is unloaded — the save flow copies it to a persistent path immediately; don't delay this copy.
- **`FeaturedBanner`** — tappable card above the grid; calls `router.push('/solar-system')`. Purple-accented (`accentPurple` border + left stripe).
- **`LoadingScreen`** — absolute-fill splash shown while `useSoundPlayer.isReady === false`. Fades out over 600 ms. Internally runs several looping `Animated` animations in parallel: star twinkling (staggered per-star timers), constellation line opacity, cloud parallax drift, and a moon breathing pulse — all via `Animated.loop(Animated.sequence([...]))`.

### Solar System screen (`app/solar-system.tsx`)

Standalone screen with its own `useSoundPlayer(SOLAR_SOUNDS)` instance. All 8 sounds have `file: null`, so the player is ready instantly (no loading screen shown). Back navigation via `router.back()`. `SoundModal` on this screen shows mythology info via the description panel.

### New Architecture

`newArchEnabled: true` in `app.json`. Any new native modules must support Fabric/TurboModules. Android has `edgeToEdgeEnabled: true` — always account for system bar insets when building Android UI.

### TypeScript

`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`. All new files must be `.tsx`/`.ts`.

### Conventions

- Use `StyleSheet.create` for all styles — no inline style objects.
- Screen components are default exports; helper/UI components are named exports.
- Orientation is locked to portrait (`app.json`).
- The home screen `timerArea` View at the bottom is reserved for the Phase 2 sleep timer — leave it in place.
