---
name: Wealthly App Architecture
description: Key decisions for the Wealthly personal finance Expo app
---

- Single `FinanceContext` at root provides all CRUD via typed interfaces — no Redux needed
- `getDb()` singleton returns WebDb on web, real SQLite on native
- `refreshAll()` called after every mutation — simple and reliable
- 5 tabs: Dashboard, Transactions, Budget, Analytics, Coach
- 10 modal screens for all financial entities
- Charts built with react-native-svg — no third-party chart library
- Platform.OS checks for safe area: web uses 67/34px fixed, native uses useSafeAreaInsets()
- Tab bar: NativeTabs (iOS 26+/Liquid Glass), BlurView (iOS), flat (Android/web)
