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

Uses **Expo Router** (file-based routing inside `app/`). `app/_layout.tsx` is the root Stack navigator with `headerShown: false` and `StatusBar style="light"` — it wraps the Stack with `<AudioProvider>` so audio state is shared across all screens. `app/index.tsx` is the home screen (`/`). `app/solar-system.tsx` is the Solar System bundle screen. `app/sounds.tsx` is a dedicated Sound Mixer screen (accessed from BottomNav). New screens go in `app/` as files.

`App.js` and `index.js` are legacy stubs — do not modify them. The actual entry is `expo-router/entry` (set in `package.json` `main`).

### Branch strategy

- `main` — stable releases
- `develop` — integration branch; PRs target `develop`, not `main`
- `feature/*` — feature branches cut from `develop`

### Key dependencies

| Package | Purpose |
|---|---|
| `expo-audio` | Audio playback and microphone recording — replaced `expo-av` at SDK 54. Use `createAudioPlayer` for imperative looping ambient playback; `volume` is a synchronous property setter (`player.volume = 0.5`), not an async method. Use `useAudioRecorder` hook for mic capture. |
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
| `colors.cardGlow` | `#2D5986` | Active card glow tint |
| `colors.pillActive` | `#1E3A5F` | Active filter pill background |
| `colors.tabActive` | `#4A7CB5` | Active bottom nav tab icon |

### Sound system

Two parallel hooks manage audio — both share the same fade/volume patterns but handle different sound sources:

**`hooks/useSoundPlayer.ts`** — accepts a `SoundDef[]` parameter (stable module-level constant). Preloads `expo-audio` `AudioPlayer` instances (via `createAudioPlayer`) at mount (looping, volume 0). Exposes `{ active, volumes, toggle, setVolume, isReady }`. Sounds with `file: null` (e.g. Solar System placeholders) are counted as loaded immediately without creating an audio instance — `toggle` still updates active state but plays nothing. Per-sound volumes saved to AsyncStorage under `sf_vol_<id>`. Fade in/out uses `setInterval` (30 steps, 1500 ms in / 1000 ms out) — intentionally not `Animated.timing`, to keep fine-grained step control. Used by both the home screen (`SOUNDS`) and the Solar System screen (`SOLAR_SOUNDS`).

> **Critical**: the sounds array is captured in a `useRef` at mount. Passing an inline array literal causes the ref to never update and will break the hook — always pass a stable module-level constant.

**`hooks/useRecordingPlayer.ts`** — manages user recordings stored as URI-based `expo-audio` `AudioPlayer` instances (via `createAudioPlayer`). Persists `RecordingMeta[]` (id, name, filePath, createdAt) to AsyncStorage under `user_recordings`. Files are copied to `FileSystem.documentDirectory + 'recordings/'` on save using timestamp-based IDs (`rec_${Date.now()}.m4a`). Exposes the same `{ active, volumes, toggle, setVolume }` shape plus `{ recordings, soundDefs, addRecording, deleteRecording }`. `soundDefs` is a derived `SoundDef[]` with `isUserRecording: true` and `icon: 'mic-outline'`. `deleteRecording` stops, unloads, deletes the file, and removes both the storage entry and the volume key — full cleanup in one call.

**`context/AudioContext.tsx`** — React context that combines `useSoundPlayer` + `useRecordingPlayer` into a single `AudioProvider`. Exposes `{ allSounds, allActive, allVolumes, handleToggle, handleSetVolume, isReady, recordings, addRecording, deleteRecording, pauseAll, resumeAll }` via `useAudio()`. `pauseAll`/`resumeAll` fade all active sounds out/in — used by `stories.tsx` when a story starts/stops playback. Mounted at the root in `_layout.tsx` — consume via `useAudio()` instead of calling the hooks directly in screens. The home and sounds screens both use this context; `solar-system.tsx` still runs its own `useSoundPlayer(SOLAR_SOUNDS)` instance independently.

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
  category?: string;        // e.g. 'nature' — used for future filter logic
}
```

`SOUNDS` (built-in, 5 entries) lives in `constants/sounds.ts`. `SOLAR_SOUNDS` (8 entries, all `file: null`) extends `SoundDef` with required `subtitle` and `description` — lives in `constants/solarSounds.ts`.

### Grid layout

The home screen `FlatList` (3 columns) is built from `buildGridData(allSounds)` which appends a `{ id: '__add' }` add-button item and then pads to a multiple of 3 with `isEmpty` spacers. `renderItem` switches on `item.id === '__add'` and `'isEmpty' in item` before rendering a `SoundCard`. The `FlatList` uses `ListHeaderComponent` to place `<FeaturedBanner />`, a **Favorites row**, and section label above the grid.

**Favorites**: Users heart-tap any sound card to favorite it; IDs saved to AsyncStorage under `favorite_sounds`. The Favorites row above the grid shows favorited sounds as a horizontal list — tap to play, long-press to open modal. Shows "Hold any sound to favorite it ♡" placeholder when empty.

**Featured Bundles carousel**: A horizontal snapping `ScrollView` (snapToInterval = screen width) sits above Favorites, containing the Solar System `FeaturedBanner` (card 1) and a Fantasy Worlds banner (card 2, navigates to `/stories`). Both cards are `SCREEN_WIDTH - 24` wide.

**Header**: Two icon buttons in the top-right — `storefront-outline` (navigates to `/shop`) and `settings-outline` (currently no-op).

**Discover section**: Three discovery cards link to Breathing, Sleep Stories, and Solar System screens. `SLEEP_COMBOS` (defined in `index.tsx`) is a static array of preset sound combination objects — each entry has a name, icon, and `sounds` array of `{ id, volume }` pairs.

Filter pills (`All`, `Nature`, `Space`, `Personal`) sit in a horizontal `ScrollView` above the grid. `Space` is not a filter — it loads `SOLAR_SOUNDS` into the grid inline (using a separate `useSoundPlayer(SOLAR_SOUNDS)` instance) rather than navigating away. The others set `activeFilter` state which filters `allSounds` before passing to `buildGridData`.

### Components

- **`SoundCard`** — `memo`-wrapped; wraps `<Slider>` in `<View onStartShouldSetResponder>` to prevent drag events from bubbling. Renders optional `subtitle` below the name. Tap = toggle, long-press (400 ms) = open modal. Shows a heart icon (top-right) when `onFavoriteToggle` prop is provided — filled pink (`#E8688A`) when favorited, muted when not.
- **`SoundModal`** — full-screen overlay; receives `sounds: SoundDef[]` as prop (not hardcoded). Left/right nav cycles through the list. Shows `subtitle` and an info button (ⓘ) when `description` is present — tapping reveals a scrollable mythology card with opacity animation. Shows a trash-icon delete button when `sound.isUserRecording && onDelete` is provided; calls `onDelete(id)` then `onClose()`.
- **`RecordingModal`** — `Modal`-based (not an absolute-fill overlay). Three internal modes: `choose` (Record / Import File), `record` (live 00:00 timer, red stop button), `preview` (play/pause + name `TextInput` + Save/Discard). Uses `useAudioRecorder` from `expo-audio` for mic capture, `expo-document-picker` for file import. On save, delegates file copy to `useRecordingPlayer.addRecording`. On iOS, `Audio.Recording.getURI()` returns a temporary URI that's invalidated after the recording is unloaded — the save flow copies it to a persistent path immediately; don't delay this copy. Recording name is capped at `MAX_NAME_LENGTH = 50` characters (enforced on every keystroke). Imported files are validated against `ALLOWED_AUDIO_EXTENSIONS` (mp3, m4a, aac, wav, ogg, flac, opus, aiff, wma) — invalid files show an `Alert` before dismissing. Preview playback uses `useAudioPlayerStatus` + `didJustFinish` to auto-pause when playback completes naturally.
- **`FeaturedBanner`** — tappable card linking to `/solar-system`. Purple-accented (`accentPurple` border). Accepts optional `bundleWidth?: number` prop — when provided, overrides `marginHorizontal` so the card fits correctly inside a horizontal `ScrollView` alongside other bundle cards.
- **`LoadingScreen`** — absolute-fill splash shown while `useSoundPlayer.isReady === false`. Fades out over 600 ms. Internally runs several looping `Animated` animations in parallel: star twinkling (staggered per-star timers), constellation line opacity, cloud parallax drift, and a moon breathing pulse — all via `Animated.loop(Animated.sequence([...]))`.
- **`BottomNav`** — persistent tab bar rendered at the bottom of every main screen. Five tabs: `/` (home), `/sounds` (mixer), `/breathe`, `/stories`, `/timer`. Uses `usePathname` to highlight the active tab with `colors.tabActive` and a small dot indicator. Navigates via `router.replace` (not `push`) to avoid stacking screens.

### Breathe screen (`app/breathe.tsx`)

Fully implemented breathing exercise screen with 4 selectable techniques: **4-7-8**, **Box Breathing**, **Diaphragmatic**, and **2:1 Breathing**. Each has a description card with clinical info. Animation: an `Animated.timing`-driven circle expands on inhale and contracts on exhale; a rotating progress ring wraps it. Live countdown shows seconds remaining in the current phase; a cycle counter tracks progress (`TOTAL_CYCLES = 4`). Phases are color-coded (blue inhale, purple hold, dark blue exhale). Controls: Start / Stop / Try Again. Completion shows "Well done. Your body is ready to sleep. 🌙".

### Sounds screen (`app/sounds.tsx`)

Dedicated Sound Mixer tab (`/sounds`). Mirrors the home screen's sound grid exactly — same `buildGridData()`, same filter pills (All / Nature / Space / Personal), same `useAudio()` context, same `SoundModal` and `RecordingModal` wiring. The Space filter spawns a separate `useSoundPlayer(SOLAR_SOUNDS)` instance inline. Exists as a dedicated tab so the mixer is always one tap away regardless of what content the home screen shows in future phases.

### Sleep Stories screen (`app/stories.tsx`)

Two story rows, each a horizontal Netflix-style scroll:

- **FREE STORIES** — 3 hand-crafted stories (Crystal Forest, Floating Library, Moon Garden). `Story` objects carry `durationMin`/`durationSecs`, full narrative text, icon, and `iconColor`.
- **FANTASY WORLDS** — 3 premium stories (Journey of Wukong, Dragon's Search, Ember Night). Same `Story` shape plus `isPremium: true`, `price: string`, and optional `disclaimer` (shown on the card for fan works). Tapping a premium card shows `PurchaseModal` instead of opening the player — purchase is a placeholder (no real IAP yet).

The player panel slides up via `Animated.spring` over the story list. Two modes, toggled by header pills:

- **Listen mode** — play/pause, ±15 s skip, progress bar (driven by `setInterval` at `speed` Hz), speed selector (0.75×–1.5×), "Mix with sounds" toggle (`pauseAll`/`resumeAll`). Static decorative elements (stars, crescent moon, cloud shapes) overlay the panel background via `StyleSheet.absoluteFill` + `pointerEvents="none"`. Audio narration not yet wired (`TODO: add narrated audio file`).
- **Read mode** — thin reading-progress bar, full-text `ScrollView`. **Guide feature**: a "Guide OFF/ON" pill in the header activates guided reading. When ON, two sub-mode pills appear:
  - *Auto-scroll*: `setInterval` calls `scrollTo` by 30 px per tick; speed 1–5 controls the interval (`GUIDE_SPEED_INTERVALS = [3000, 1800, 1400, 1100, 800]` ms). Tap anywhere on the text to pause/resume.
  - *Word by word*: renders text as nested `<Text onPress>` spans; an interval increments `highlightedWordIdx` (highlighted in `colors.tabActive` + bold). Tapping a word jumps to it.
  - A 🐢/🐇 `Slider` controls speed for both sub-modes.

An informational card ("Why stories help you sleep") with ✦-prefixed stat pills sits above the rows. `PanelDecorations` (stars, crescent moon, soft clouds) is rendered inside both the listen panel and the read container.

### Shop screen (`app/shop.tsx`)

Premium store at `/shop`. Navigated to from the `storefront-outline` button in the home screen header. Layout: back button + SLEEPFLOW/Premium header, full-width featured bundle card (Fantasy Worlds, $2.99), then a 2-column grid of individual items (4 items: 3 story unlocks + Solar System Sounds). All "Buy" / "Buy Bundle" buttons are placeholders — tapping shows `Alert("Coming soon!")`. Includes `<BottomNav />` at the bottom.

### Stub screens

`app/timer.tsx` is a placeholder screen ("Coming soon") wired into `BottomNav`. Follows the same pattern as other screens: `useSafeAreaInsets` for top padding, centered text, and `<BottomNav />` at the bottom. Implement content inside the `content` View.

### Solar System screen (`app/solar-system.tsx`)

Standalone screen with its own `useSoundPlayer(SOLAR_SOUNDS)` instance. All 8 sounds have `file: null`, so the player is ready instantly (no loading screen shown). Back navigation via `router.back()`. `SoundModal` on this screen shows mythology info via the description panel.

### New Architecture

`newArchEnabled: true` in `app.json`. Any new native modules must support Fabric/TurboModules. Android has `edgeToEdgeEnabled: true` — always account for system bar insets when building Android UI.

### TypeScript

`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`. All new files must be `.tsx`/`.ts`.

### Logging

Non-fatal errors in hooks use `console.warn('[SleepFlow] ...')` — the `[SleepFlow]` prefix makes them easy to filter in Metro/Logcat output.

### Conventions

- Use `StyleSheet.create` for all styles — no inline style objects.
- Screen components are default exports; helper/UI components are named exports.
- Orientation is locked to portrait (`app.json`).
- The home screen `timerArea` View (`height: 4`) sits between the grid and `BottomNav` — leave it in place as a Phase 2 hook point.
- New main screens must include `<BottomNav />` and respect `useSafeAreaInsets` for top padding (no global layout wrapper exists).
- New screens that need audio should consume `useAudio()` from `context/AudioContext.tsx`, not call the raw hooks directly.
