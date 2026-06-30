# Wealthly

A world-class personal finance mobile app built with Expo/React Native. 100% offline SQLite storage, AI coach, 16+ financial modules, dark/light theme, and a 5-tab navigation.

## Run & Operate

- `pnpm --filter @workspace/mobile run dev` — run the Expo app (scan QR with Expo Go or open web preview)
- `pnpm run typecheck` — full typecheck across all packages
- Required env: none (fully offline app)

## Stack

- Expo SDK + React Native
- expo-sqlite (SQLite — all data stays on device)
- expo-router (file-based navigation)
- expo-linear-gradient, expo-haptics, expo-blur
- react-native-svg (custom charts)
- @expo/vector-icons (Ionicons, Feather)
- TypeScript 5.9

## Where things live

- `artifacts/mobile/app/(tabs)/` — 5 tab screens (Dashboard, Transactions, Budget, Analytics, Coach)
- `artifacts/mobile/app/modals/` — 10 modal screens (add-transaction, accounts, goals, bills, debt, investments, journal, wishlist, settings, categories)
- `artifacts/mobile/context/FinanceContext.tsx` — full CRUD for all entities, typed interfaces
- `artifacts/mobile/lib/database.ts` — SQLite schema, seed data, web fallback
- `artifacts/mobile/constants/colors.ts` — dark/light theme tokens
- `artifacts/mobile/components/` — shared UI (MoneyText, ProgressBar, CircularProgress, EmptyState, TransactionRow, charts)

## Architecture decisions

- 100% offline SQLite storage via expo-sqlite with synchronous API on native; web preview uses an in-memory WebDb stub (SharedArrayBuffer not available in web without COOP/COEP headers)
- Single `FinanceProvider` context at root provides typed CRUD for all 10 entities
- `getDb()` singleton pattern — database opened once and reused
- Charts built with react-native-svg (no third-party chart library dependency)
- Platform.OS checks for safe-area insets (web uses fixed values, native uses useSafeAreaInsets)

## Product

**Wealthly** gives users complete financial visibility:
- **Dashboard** — net worth, monthly income/expense, account balances, goals progress, upcoming bills alerts
- **Transactions** — searchable, filterable list with grouped-by-date display
- **Budget** — category budgets with circular health indicator, bill tracking, month navigation
- **Analytics** — spending trends (line chart), category breakdown (donut), income vs expense (bar chart), financial health metrics
- **Coach** — AI-powered offline coach with 6 insight types and interactive Q&A quick replies
- **10 modal flows** — add transaction (custom numpad), accounts, goals with contribution tracking, bills with paid/unpaid toggle, debt payoff tracker, investment portfolio, financial journal with moods, wishlist with priorities, categories, settings with CSV export

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- expo-sqlite sync API requires SharedArrayBuffer on web — app uses WebDb in-memory fallback for web preview; real SQLite works on iOS/Android via Expo Go
- expo-sqlite version warning (~15.2.14 vs expected ~16.0.10) — app still works; upgrade when expo-sqlite 16 is stable in catalog
- Do NOT use contentInsetAdjustmentBehavior="automatic" with custom tab bars — conflicts with bottom insets
- All colors via useColors() hook — never hardcode colors outside constants/colors.ts

## Pointers

- See `DESIGN_REPORT.md` for the comprehensive 17-section design document
- See the `expo` skill for Expo/React Native conventions
- See the `pnpm-workspace` skill for workspace structure
