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

**SleepFlow** is an Expo-managed React Native sleep/wellness app (React 19, RN 0.81, Expo 54) targeting iOS, Android, and Web. The app is in early-stage development — `components/` and `hooks/` directories exist but are currently empty placeholders.

### Routing

Uses **Expo Router** (file-based routing inside `app/`). `app/_layout.tsx` is the root Stack navigator with `headerShown: false` and `StatusBar style="light"` (white icons on dark background). `app/index.tsx` is the `/` home screen. New screens go in `app/` as files or nested folders.

`App.js` and `index.js` exist as legacy stubs — the actual app entry is `expo-router/entry` (set in `package.json` `main`). Do not modify these stubs.

The app deep-link scheme is `sleepflow` (configured in `app.json`).

### Branch strategy

- `main` — stable releases
- `develop` — integration branch; PRs target `develop`, not `main`
- `feature/*` — feature branches cut from `develop`

### Key installed dependencies (not yet wired up)

| Package | Purpose |
|---|---|
| `expo-av` | Audio playback (sleep sounds — `assets/sounds/` is the target directory) |
| `expo-notifications` | Push/local notifications |
| `@react-native-async-storage/async-storage` | Local persistence |
| `react-native-reanimated` v4 | Animations (Babel plugin already configured in `babel.config.js`) |
| `react-native-worklets` | Required peer dep for reanimated v4 — Expo SDK 54 expects v0.5.1 (not latest); must be listed explicitly in `dependencies` |
| `expo-linking` | Deep-link URL parsing — required by Expo Router |
| `react-native-safe-area-context` | Safe area insets — required for Android edge-to-edge (`edgeToEdgeEnabled: true`) |
| `react-native-google-mobile-ads` | AdMob ads |
| `react-native-iap` | In-app purchases |

### Theme

All colors live in `constants/colors.ts` and are consumed via named tokens:

| Token | Hex | Usage |
|---|---|---|
| `colors.background` | `#0A0A0F` | Screen backgrounds |
| `colors.surface` | `#0D0D1A` | Card/panel surfaces |
| `colors.accentBlue` | `#2D5986` | Primary accent |
| `colors.accentPurple` | `#2D1B4E` | Secondary accent |
| `colors.textPrimary` | `#E8E8F0` | Main text |
| `colors.textSecondary` | `#8888A0` | Muted/secondary text |
| `colors.border` | `#1A1A2E` | Dividers and borders |

The app enforces dark theme (`userInterfaceStyle: "dark"` in `app.json`). Always import from `constants/colors` — never hardcode hex values in component files.

### New Architecture

`newArchEnabled: true` is set in `app.json`. Any new native modules must support the React Native New Architecture (Fabric/TurboModules). Android also has `edgeToEdgeEnabled: true` — account for system bar insets when building Android UI.

### TypeScript

`tsconfig.json` extends `expo/tsconfig.base` with `strict: true`. All new files should be `.tsx`/`.ts`.

### Conventions

- Use `StyleSheet.create` for all styles — no inline style objects.
- Screen components are default exports; helper/UI components are named exports.
- Orientation is locked to portrait (`app.json`).
