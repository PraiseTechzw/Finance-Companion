---
name: Expo SQLite Web Fallback
description: expo-sqlite synchronous API fails on web without COOP/COEP headers; solution is a WebDb in-memory stub
---

expo-sqlite's sync API (`openDatabaseSync`, `getAllSync`, `runSync`) requires `SharedArrayBuffer` which is only available in cross-origin isolated contexts (COOP + COEP headers). The Expo web preview does not set these headers.

**Why:** Without `SharedArrayBuffer`, the sync worker cannot communicate with the main thread, so `openDatabaseSync` throws `ReferenceError: SharedArrayBuffer is not defined`.

**How to apply:** In `lib/database.ts`, detect `Platform.OS === 'web'` and return a `WebDb` in-memory class that implements the same interface (`getAllSync`, `getFirstSync`, `runSync`, `execSync`, `withTransactionSync`). Pre-populate it with realistic seed data so the web preview shows a useful UI.

The real SQLite DB works fine on iOS/Android via Expo Go — only the web preview is affected.
