# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npx expo start          # Start dev server (scan QR with Expo Go)
npx expo start --android
npx expo start --ios
npx expo start --web

npm install             # Install dependencies
```

No test suite is configured yet.

## Architecture

**SleepFlow** is an Expo-managed React Native sleep/wellness app targeting iOS, Android, and Web.

### Routing

Uses **Expo Router** (file-based routing inside `app/`). `app/_layout.tsx` is the root Stack navigator with `headerShown: false`. `app/index.tsx` is the `/` home screen. New screens go in `app/` as files or nested folders.

> `App.js` and `index.js` exist as legacy stubs — the actual app is driven by `app/` via the expo-router plugin in `app.json`.

### Key installed dependencies (not yet wired up)

| Package | Purpose |
|---|---|
| `expo-av` | Audio playback (sleep sounds) |
| `expo-notifications` | Push/local notifications |
| `@react-native-async-storage/async-storage` | Local persistence |
| `react-native-reanimated` | Animations (requires Babel plugin — already configured) |
| `react-native-google-mobile-ads` | AdMob ads |
| `react-native-iap` | In-app purchases |

### Theme

All colors live in `constants/colors.ts`. The app enforces a dark theme (`userInterfaceStyle: "dark"` in `app.json`). Background is `#0A0A0F`, accent colors are dark blues and purples.

### New Architecture

`newArchEnabled: true` is set in `app.json`. Any new native modules must support the React Native New Architecture (Fabric/TurboModules).

### Audio assets

Place audio files in `assets/sounds/`. Load them with `expo-av`.
