# Wealthly — Personal Finance App
## Professional Software Design Report

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Objectives](#2-project-objectives)
3. [Problem Statement](#3-problem-statement)
4. [Target Users](#4-target-users)
5. [Functional Requirements](#5-functional-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [System Architecture](#7-system-architecture)
8. [Database Design](#8-database-design)
9. [Screen-by-Screen UI/UX Specifications](#9-screen-by-screen-uiux-specifications)
10. [Navigation Flow](#10-navigation-flow)
11. [Feature Breakdown](#11-feature-breakdown)
12. [Technology Stack](#12-technology-stack)
13. [Offline Data Strategy](#13-offline-data-strategy)
14. [Security Considerations](#14-security-considerations)
15. [Design Principles](#15-design-principles)
16. [Development Roadmap](#16-development-roadmap)
17. [Future Enhancements](#17-future-enhancements)

---

## 1. Executive Summary

**Wealthly** is a premium, fully offline personal finance mobile application built with React Native and Expo. Designed to serve as an intelligent financial companion rather than a simple expense tracker, Wealthly empowers users to manage every aspect of their financial lives — from daily transactions to long-term investment tracking — entirely on-device.

Unlike cloud-dependent finance apps, Wealthly stores all user data locally using SQLite, ensuring complete privacy, zero latency, and full functionality without an internet connection. An intelligent offline financial coach analyzes local spending patterns and delivers personalized, conversational insights that feel like advice from a trusted financial mentor.

The application targets the growing segment of privacy-conscious consumers and personal finance enthusiasts who want the polish and intelligence of premium fintech products without compromising their financial data to third-party servers.

**Key Differentiators:**
- 100% offline — no account required, no data leaves the device
- 16+ interconnected financial modules in a single app
- Intelligent rule-based financial coach with natural language insights
- Premium UI/UX rivaling Coinbase, Robinhood, and Revolut
- Dark-first design with dynamic light/dark mode support

---

## 2. Project Objectives

### Primary Objectives

1. **Comprehensive Financial Management** — Provide a single application that replaces the need for multiple finance apps (budgeting, investment tracking, debt management, savings goals, etc.)

2. **Complete Offline Functionality** — All features must work without internet connectivity. No user data is ever transmitted to external servers.

3. **Intelligent Financial Coaching** — Deliver personalized, data-driven financial insights using on-device analysis — congratulating positive behavior, warning about risks, and suggesting improvements.

4. **Premium User Experience** — Build a mobile application indistinguishable in quality from top-tier fintech products available today.

5. **Privacy by Design** — User financial data never leaves the device, ensuring compliance with user privacy expectations and eliminating server-side security risks.

### Secondary Objectives

- Provide detailed financial analytics with interactive charts
- Support multiple accounts and currencies
- Enable financial planning through goals, budgets, and projections
- Create a habit of financial mindfulness through daily journaling
- Offer export capabilities for personal records

---

## 3. Problem Statement

### The Core Problem

Modern personal finance management is fragmented, invasive, and poorly designed:

**Fragmentation:** Users need 4-6 separate apps to manage budgets, track investments, monitor debt, set savings goals, and track bills. Context switching between apps creates friction and discourages consistent financial tracking.

**Privacy Invasion:** Most finance apps require bank account linking (Plaid, Yodlee) or account creation, exposing sensitive financial data to third parties. Security breaches at fintech companies regularly expose millions of users' transaction histories.

**Poor Design:** The majority of personal finance apps are functional but uninspiring — they feel like spreadsheets wrapped in a mobile shell rather than products people actually want to use.

**Lack of Intelligence:** Existing apps display data but don't interpret it. Users are left to draw their own conclusions from charts and tables without contextual guidance.

**Internet Dependency:** Apps that require connectivity fail when users need them most — traveling internationally, in areas with poor signal, or when servers are down.

### The Solution

Wealthly addresses each pain point directly:

| Problem | Wealthly Solution |
|---------|------------------|
| Fragmentation | 16+ integrated financial modules in one app |
| Privacy | 100% offline SQLite storage — data never leaves device |
| Poor design | Premium dark-first UI inspired by Coinbase, Bloomberg |
| Lack of intelligence | Offline coach with 20+ insight categories |
| Internet dependency | Zero network requirements for any feature |

---

## 4. Target Users

### Primary Persona: "The Intentional Saver"

**Demographics:** Ages 25-45, employed professionals, moderate to high income

**Characteristics:**
- Financially literate and motivated to improve money management
- Privacy-conscious — uncomfortable linking bank accounts to third-party apps
- Values aesthetics and UX quality — uses premium apps exclusively
- Willing to manually enter transactions in exchange for control and privacy
- Has multiple financial goals simultaneously (emergency fund, vacation, retirement)

**Goals:**
- Know exactly where money goes each month
- Stay on budget across multiple categories
- Track progress toward savings goals
- Understand net worth trajectory over time
- Get intelligent feedback without a human financial advisor

**Pain Points:**
- Current apps require cloud accounts or bank linking
- Multiple apps needed for different financial aspects
- No app provides coaching alongside tracking
- Most finance apps look like enterprise software, not consumer products

### Secondary Persona: "The Privacy Absolutist"

**Demographics:** Ages 20-35, tech-savvy, various income levels

**Characteristics:**
- Treats financial privacy as non-negotiable
- Refuses to link bank accounts to any app
- Comfortable with manual data entry
- Uses end-to-end encrypted tools across digital life

**Goals:**
- Track finances without any cloud data
- Zero trust in third-party servers for financial data

### Tertiary Persona: "The Goal-Oriented Achiever"

**Demographics:** Ages 28-50, goal-driven professionals

**Characteristics:**
- Focused on specific financial milestones (house down payment, debt freedom, early retirement)
- Needs motivation and progress visualization
- Benefits from the financial coach for milestone celebration

---

## 5. Functional Requirements

### FR-01: Transaction Management
- **FR-01.1** Record income, expense, and transfer transactions
- **FR-01.2** Assign transactions to accounts, categories, and custom tags
- **FR-01.3** Attach notes to any transaction
- **FR-01.4** Edit and delete existing transactions with swipe gestures
- **FR-01.5** Search transactions by description, amount, category, or tag
- **FR-01.6** Filter transactions by date range, type, account, and category
- **FR-01.7** Group transactions chronologically with date headers

### FR-02: Account Management
- **FR-02.1** Create multiple wallets/accounts (Checking, Savings, Cash, Investment, Credit Card)
- **FR-02.2** Set account balance manually and update via transactions
- **FR-02.3** Assign custom name, color, and icon to each account
- **FR-02.4** Transfer funds between accounts
- **FR-02.5** Designate a primary account for dashboard display
- **FR-02.6** View per-account transaction history

### FR-03: Budget Management
- **FR-03.1** Set monthly budgets per category
- **FR-03.2** Track real-time budget utilization as transactions are added
- **FR-03.3** Visual alert when category budget exceeds 80% / 100%
- **FR-03.4** Navigate between months to view historical budgets
- **FR-03.5** Overall budget health score with gauge visualization
- **FR-03.6** Copy budget from previous month

### FR-04: Savings Goals
- **FR-04.1** Create savings goals with name, target amount, deadline, and icon
- **FR-04.2** Add contributions toward goals manually
- **FR-04.3** Visual circular progress indicator per goal
- **FR-04.4** Projection: estimated completion date based on current savings rate
- **FR-04.5** Celebration animation when a goal is reached
- **FR-04.6** Pause or archive goals

### FR-05: Wishlist
- **FR-05.1** Add wishlist items with name, price, priority, and notes
- **FR-05.2** Assign priority level: Low / Medium / High
- **FR-05.3** Mark items as purchased
- **FR-05.4** Sort wishlist by priority, price, or date added
- **FR-05.5** Link wishlist items to savings goals

### FR-06: Bills & Recurring Expenses
- **FR-06.1** Track bills with name, amount, due day, and recurrence pattern
- **FR-06.2** Recurrence options: Monthly, Weekly, Yearly
- **FR-06.3** Toggle bill paid/unpaid status per period
- **FR-06.4** Dashboard alert strip for bills due within 7 days
- **FR-06.5** Auto-calculate next due date based on recurrence

### FR-07: Debt Tracking
- **FR-07.1** Track debts owed (credit cards, loans, personal debts)
- **FR-07.2** Track lending (money owed to user)
- **FR-07.3** Record partial payments against principal
- **FR-07.4** Display debt payoff progress bar
- **FR-07.5** Track interest rates and calculate total cost
- **FR-07.6** Debt-to-income ratio on analytics screen

### FR-08: Investment Tracking
- **FR-08.1** Log investment purchases with name, type, cost basis, and date
- **FR-08.2** Investment types: Stocks, Crypto, Bonds, Real Estate, Other
- **FR-08.3** Update current value to track gain/loss
- **FR-08.4** Portfolio allocation pie chart (SVG)
- **FR-08.5** Total portfolio value and overall return percentage

### FR-09: Financial Journal
- **FR-09.1** Write daily journal entries with free-form text
- **FR-09.2** Select mood for each entry (5-point scale with icons)
- **FR-09.3** Calendar grid view with colored indicators for entries
- **FR-09.4** View, edit, and delete past journal entries
- **FR-09.5** Search journal entries by content

### FR-10: Categories & Tags
- **FR-10.1** 20+ preset categories with color-coded icons
- **FR-10.2** Create custom categories with custom icon and color
- **FR-10.3** Assign categories to transactions
- **FR-10.4** Set per-category budget limits
- **FR-10.5** Custom tags for additional transaction grouping

### FR-11: Analytics & Reporting
- **FR-11.1** Spending trend line chart (1W, 1M, 3M, 6M, 1Y)
- **FR-11.2** Spending by category donut chart
- **FR-11.3** Income vs. expense grouped bar chart
- **FR-11.4** Net worth over time area chart
- **FR-11.5** Top spending categories ranked list
- **FR-11.6** Key metrics: savings rate %, budget adherence %, debt-to-income ratio
- **FR-11.7** Export financial report as CSV (shown in-app)

### FR-12: Dashboard
- **FR-12.1** Net worth display with month-over-month change
- **FR-12.2** Account balance cards in horizontal scroll
- **FR-12.3** Income vs. expense monthly summary
- **FR-12.4** Recent transactions (last 5)
- **FR-12.5** Savings goal progress preview (top 2)
- **FR-12.6** Upcoming bills alert strip
- **FR-12.7** Quick action buttons (Add Transaction, Transfer, Budget, Goals)
- **FR-12.8** Financial health score (composite metric)

### FR-13: Offline Financial Coach
- **FR-13.1** Analyze local transaction data for spending patterns
- **FR-13.2** Generate budget overspending alerts
- **FR-13.3** Praise savings milestones and positive behavior
- **FR-13.4** Remind about upcoming bills and due dates
- **FR-13.5** Track and celebrate debt payoff progress
- **FR-13.6** Provide goal completion projections
- **FR-13.7** Deliver monthly financial summaries
- **FR-13.8** Suggest optimization strategies based on spending patterns
- **FR-13.9** Conversational quick-reply interaction buttons
- **FR-13.10** Unread insight badge count on tab bar

### FR-14: Settings
- **FR-14.1** Currency selection (USD, EUR, GBP, JPY, and others)
- **FR-14.2** Theme toggle: Light / Dark / System
- **FR-14.3** Export all data as CSV
- **FR-14.4** Clear all data with confirmation dialog
- **FR-14.5** App version and build information

---

## 6. Non-Functional Requirements

### NFR-01: Performance
- App launch: cold start < 2 seconds
- Screen navigation: < 100ms transition
- SQLite query response: < 50ms for standard queries
- Chart rendering: < 300ms for SVG generation
- List rendering: smooth 60fps with 1000+ transactions

### NFR-02: Offline Capability
- 100% feature availability with no network connection
- Zero network permissions required
- No analytics, telemetry, or crash reporting calls
- Full functionality in airplane mode

### NFR-03: Data Integrity
- ACID-compliant SQLite transactions for all writes
- No data loss on unexpected app termination (WAL journal mode)
- Input validation on all forms before database writes
- Graceful error handling with user-facing error messages

### NFR-04: Usability
- Maximum 3 taps to reach any core feature
- Consistent navigation patterns across all screens
- Accessible color contrast ratios (WCAG AA minimum)
- Haptic feedback on all actionable interactions
- Form inputs use contextually appropriate keyboards

### NFR-05: Maintainability
- TypeScript strict mode throughout
- Component-level separation of concerns
- Centralized finance context for shared state
- Reusable chart components for all visualizations
- Consistent naming conventions (camelCase for variables, PascalCase for components)

### NFR-06: Compatibility
- iOS 15.0 and above
- Android 10 (API 29) and above
- Expo Go compatible (no native build required for development)
- React Native Web support for development preview

### NFR-07: Storage
- Initial app size: < 30MB
- SQLite database grows < 5MB per year of average use
- No external storage permissions required
- All data confined to app sandbox

---

## 7. System Architecture

### Architecture Pattern

Wealthly follows a **layered offline-first architecture** with clear separation between data, business logic, and presentation layers:

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                     │
│  ┌──────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │  Screens │  │  Components │  │  Charts (SVG)      │  │
│  │ (Expo    │  │  (Shared    │  │  (react-native-    │  │
│  │  Router) │  │   UI Kit)   │  │   svg custom)      │  │
│  └──────────┘  └─────────────┘  └────────────────────┘  │
├─────────────────────────────────────────────────────────┤
│                   State Management Layer                  │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              FinanceContext (React Context)          │ │
│  │  • All CRUD operations    • Computed aggregates     │ │
│  │  • Cross-module linking   • Data refresh triggers   │ │
│  └─────────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────────┤
│                     Business Logic Layer                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │  Financial  │  │    Coach     │  │   Analytics   │   │
│  │ Calculators │  │   Engine     │  │   Aggregators │   │
│  │ (net worth, │  │  (rule-based │  │  (grouping,   │   │
│  │  savings %) │  │   insights)  │  │   charting)   │   │
│  └─────────────┘  └──────────────┘  └───────────────┘   │
├─────────────────────────────────────────────────────────┤
│                      Data Layer                           │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              expo-sqlite (SQLite 3.x)               │ │
│  │  • WAL journal mode      • ACID transactions        │ │
│  │  • Synchronous API       • Prepared statements      │ │
│  └─────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### Folder Structure

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx              # Root stack layout + providers
│   ├── (tabs)/
│   │   ├── _layout.tsx          # Tab bar configuration (5 tabs)
│   │   ├── index.tsx            # Dashboard screen
│   │   ├── transactions.tsx     # Transaction list + search
│   │   ├── budget.tsx           # Budget overview
│   │   ├── analytics.tsx        # Charts and insights
│   │   └── coach.tsx            # Financial coach chat
│   └── modals/
│       ├── add-transaction.tsx
│       ├── accounts.tsx
│       ├── goals.tsx
│       ├── wishlist.tsx
│       ├── bills.tsx
│       ├── debt.tsx
│       ├── investments.tsx
│       ├── journal.tsx
│       ├── settings.tsx
│       └── categories.tsx
├── components/
│   ├── charts/
│   │   ├── LineChart.tsx
│   │   ├── DonutChart.tsx
│   │   ├── BarChart.tsx
│   │   └── AreaChart.tsx
│   ├── ui/
│   │   ├── GlassCard.tsx
│   │   ├── MoneyText.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── CircularProgress.tsx
│   │   ├── CategoryBadge.tsx
│   │   ├── TransactionRow.tsx
│   │   ├── QuickActionButton.tsx
│   │   └── EmptyState.tsx
│   └── ErrorBoundary.tsx
├── context/
│   └── FinanceContext.tsx       # Central state + SQLite CRUD
├── lib/
│   └── database.ts              # SQLite schema + initialization
├── hooks/
│   └── useColors.ts             # Dark/light theme hook
├── constants/
│   └── colors.ts                # Design tokens
└── assets/
    └── images/
        └── icon.png
```

### Data Flow

```
User Action → Screen Component
                    ↓
              FinanceContext.action()
                    ↓
              database.ts (SQLite write)
                    ↓
              Context state update (useState)
                    ↓
              React re-render (all subscribed screens)
```

---

## 8. Database Design

### Entity Relationship Overview

```
accounts ──────┐
               ├──── transactions ──── categories
               │                            │
bills ─────────┘                        budgets
goals
wishlist
debts
investments
journal
```

### Table Schemas

#### `accounts`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Display name (e.g., "Chase Checking") |
| type | TEXT NOT NULL | checking / savings / cash / investment / credit |
| balance | REAL DEFAULT 0 | Current balance |
| currency | TEXT DEFAULT 'USD' | ISO 4217 currency code |
| color | TEXT NOT NULL | Hex color for UI |
| icon | TEXT NOT NULL | Ionicons icon name |
| is_primary | INTEGER DEFAULT 0 | 1 if this is the default account |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `transactions`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| account_id | TEXT NOT NULL | FK → accounts.id |
| category_id | TEXT | FK → categories.id |
| amount | REAL NOT NULL | Always positive; type determines sign |
| type | TEXT NOT NULL | income / expense / transfer |
| description | TEXT | User-provided description |
| date | TEXT NOT NULL | ISO 8601 date (YYYY-MM-DD) |
| tags | TEXT | JSON array of tag strings |
| notes | TEXT | Extended notes |
| transfer_account_id | TEXT | Target account for transfers |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `categories`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Category name |
| icon | TEXT NOT NULL | Ionicons icon name |
| color | TEXT NOT NULL | Hex color |
| type | TEXT NOT NULL | income / expense / both |
| budget_limit | REAL DEFAULT 0 | Monthly budget cap (0 = no limit) |
| is_custom | INTEGER DEFAULT 0 | 1 if user-created |
| sort_order | INTEGER DEFAULT 0 | Display ordering |

#### `budgets`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| category_id | TEXT NOT NULL | FK → categories.id |
| month | INTEGER NOT NULL | 1-12 |
| year | INTEGER NOT NULL | 4-digit year |
| limit_amount | REAL NOT NULL | Budget ceiling |
| spent_amount | REAL DEFAULT 0 | Computed from transactions |

#### `goals`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Goal name (e.g., "Vacation Fund") |
| icon | TEXT NOT NULL | Ionicons icon name |
| color | TEXT NOT NULL | Hex color |
| target_amount | REAL NOT NULL | Goal target |
| saved_amount | REAL DEFAULT 0 | Current savings toward goal |
| deadline | TEXT | ISO 8601 date (optional) |
| notes | TEXT | Additional context |
| is_completed | INTEGER DEFAULT 0 | 1 when goal is reached |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `wishlist`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Item name |
| price | REAL NOT NULL | Estimated cost |
| priority | TEXT NOT NULL | low / medium / high |
| url | TEXT | Optional purchase URL |
| notes | TEXT | Notes |
| is_purchased | INTEGER DEFAULT 0 | 1 if purchased |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `bills`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Bill name (e.g., "Netflix") |
| amount | REAL NOT NULL | Bill amount |
| due_day | INTEGER NOT NULL | Day of month (1-31) |
| category_id | TEXT | FK → categories.id |
| is_paid | INTEGER DEFAULT 0 | 1 if paid this cycle |
| recurrence | TEXT NOT NULL | monthly / weekly / yearly |
| next_due | TEXT NOT NULL | ISO 8601 next due date |
| notes | TEXT | Additional notes |

#### `debts`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Debt name (e.g., "Car Loan") |
| creditor | TEXT NOT NULL | Lender/borrower name |
| amount | REAL NOT NULL | Original principal |
| paid_amount | REAL DEFAULT 0 | Amount repaid |
| interest_rate | REAL DEFAULT 0 | Annual interest % |
| due_date | TEXT | Payoff target date |
| type | TEXT NOT NULL | owed / lending |
| notes | TEXT | Additional notes |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `investments`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| name | TEXT NOT NULL | Investment name |
| type | TEXT NOT NULL | stocks / crypto / bonds / real_estate / other |
| amount | REAL NOT NULL | Cost basis (purchase price) |
| current_value | REAL NOT NULL | Current market value |
| purchase_date | TEXT NOT NULL | ISO 8601 date |
| notes | TEXT | Additional notes |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

#### `journal`
| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PRIMARY KEY | Unique identifier |
| content | TEXT NOT NULL | Journal entry text |
| mood | TEXT NOT NULL | great / good / neutral / bad / terrible |
| date | TEXT NOT NULL | ISO 8601 date (YYYY-MM-DD) |
| created_at | TEXT NOT NULL | ISO 8601 timestamp |

### Default Categories (Seeded on First Launch)

| Name | Icon | Color | Type |
|------|------|-------|------|
| Salary | briefcase | #10B981 | income |
| Freelance | laptop | #6366F1 | income |
| Investment Returns | trending-up | #F59E0B | income |
| Food & Dining | utensils | #EF4444 | expense |
| Transportation | car | #6366F1 | expense |
| Shopping | shopping-bag | #EC4899 | expense |
| Entertainment | film | #8B5CF6 | expense |
| Health & Fitness | heart | #EF4444 | expense |
| Housing | home | #10B981 | expense |
| Education | book | #F59E0B | expense |
| Travel | map | #06B6D4 | expense |
| Utilities | zap | #F97316 | expense |
| Subscriptions | repeat | #84CC16 | expense |
| Personal Care | user | #EC4899 | expense |
| Gifts | gift | #8B5CF6 | expense |
| Other | more-horizontal | #94A3B8 | both |

---

## 9. Screen-by-Screen UI/UX Specifications

### Screen 1: Dashboard (Home Tab)

**Purpose:** Financial command center — immediate overview of financial health

**Visual Layout:**
```
┌─────────────────────────────────┐
│  Good morning, [Time Icon]       │  ← Greeting + health score badge
├─────────────────────────────────┤
│  ┌───────────────────────────┐  │
│  │    NET WORTH               │  │  ← Large gradient card
│  │    $47,832.50              │  │
│  │    ▲ +2.3% this month      │  │
│  └───────────────────────────┘  │
├─────────────────────────────────┤
│  ← Account Cards Scroll →       │  ← Horizontal FlatList
│  [Chase] [Savings] [Cash] [+]   │
├─────────────────────────────────┤
│  Income ↑         Expense ↓     │  ← Two-column stat block
│  $5,200           $3,847        │
├─────────────────────────────────┤
│  Quick Actions                  │
│  [+] [↔] [📊] [🎯]             │  ← 4 action buttons
├─────────────────────────────────┤
│  ⚠ Bills Due Soon               │  ← Alert strip (conditional)
│  Netflix $15.99 · in 3 days     │
├─────────────────────────────────┤
│  Recent Transactions            │
│  • Food     -$24.50  Today      │  ← Last 5 transactions
│  • Salary   +$5,200  Yesterday  │
├─────────────────────────────────┤
│  Savings Goals                  │
│  Vacation ████░░ 67%            │  ← Top 2 goals
│  Emergency ██░░░░ 34%           │
└─────────────────────────────────┘
```

**Interactions:**
- Net worth card: tap to navigate to Analytics
- Account cards: tap to filter transactions by account
- Quick action buttons: navigate to respective modals
- Bill alert: tap to navigate to Bills modal
- Transaction rows: tap to edit transaction
- Goals: tap to navigate to Goals modal

---

### Screen 2: Transactions Tab

**Purpose:** Complete transaction history with search and filtering

**Visual Layout:**
```
┌─────────────────────────────────┐
│  [Search icon] Search...        │  ← Search input
├─────────────────────────────────┤
│  [All] [Income] [Expense] [Tr]  │  ← Filter pills
│  [This Month ▼]                 │  ← Date range picker
├─────────────────────────────────┤
│  Income: $5,200  Expense: $3,847 │  ← Period totals
├─────────────────────────────────┤
│  TODAY                          │  ← Date group header
│  ┌───────────────────────────┐  │
│  │ 🍽 Chipotle               │  │
│  │    Food & Dining  Chase   │  │
│  │                  -$12.50  │  │
│  └───────────────────────────┘  │
│  YESTERDAY                      │
│  [transactions...]              │
├─────────────────────────────────┤
│                          [+ FAB] │  ← Floating action button
└─────────────────────────────────┘
```

**Interactions:**
- Search: real-time filter as user types
- Filter pills: instant filter switch
- Swipe left on row: reveal Delete action (red)
- Tap row: open edit transaction modal
- FAB: open add transaction modal
- Pull-to-refresh: reload from SQLite

---

### Screen 3: Budget Tab

**Purpose:** Budget management and bill tracking

**Visual Layout:**
```
┌─────────────────────────────────┐
│  ← June 2026 →                  │  ← Month navigator
├─────────────────────────────────┤
│         ╭────────╮              │
│         │  73%   │              │  ← Circular health gauge
│         │  Used  │              │
│         ╰────────╯              │
│  $2,800 of $3,850 spent         │
├─────────────────────────────────┤
│  [Overview] [Bills] [Recurring] │  ← Tab selector
├─────────────────────────────────┤
│  Category Budgets               │
│  ┌───────────────────────────┐  │
│  │ 🍽 Food & Dining           │  │
│  │  ████████░░  $425/$500    │  │  ← 85% — yellow warning
│  └───────────────────────────┘  │
│  ┌───────────────────────────┐  │
│  │ 🚗 Transportation         │  │
│  │  ██████████  $320/$300    │  │  ← Over budget — red
│  └───────────────────────────┘  │
│  [+ Add Budget Category]        │
└─────────────────────────────────┘
```

**Interactions:**
- Month navigation: swipe left/right or tap arrows
- Category card: tap to view transactions for that category
- Budget bar color: green < 80%, yellow 80-99%, red 100%+
- Bills tab: toggle paid/unpaid status per bill
- Add budget: open category picker + amount input

---

### Screen 4: Analytics Tab

**Purpose:** Deep financial insights through interactive charts

**Visual Layout:**
```
┌─────────────────────────────────┐
│  [1W] [1M] [3M] [6M] [1Y]      │  ← Time range pills
├─────────────────────────────────┤
│  Spending Trend                 │
│  ╭─────────────────────────╮   │
│  │  ╭╮   ╭─╮               │   │  ← SVG line chart
│  │ ╭╯╰───╯ ╰──╮            │   │
│  │╭╯           ╰──╮        │   │
│  ╰─────────────────────────╯   │
├─────────────────────────────────┤
│  Spending by Category           │
│         ╭────╮                  │  ← SVG donut chart
│        ╭╯ 35%╰╮                 │
│        │  Food│                 │
│        ╰╮    ╭╯                 │
│         ╰────╯                  │
│  ■ Food 35%  ■ Transport 18%    │
├─────────────────────────────────┤
│  Financial Health               │
│  Savings Rate:     23%  ●●●●○   │
│  Budget Adherence: 87%  ●●●●●   │
│  Debt-to-Income:   12%  ●●●○○   │
└─────────────────────────────────┘
```

---

### Screen 5: Coach Tab

**Purpose:** Personalized offline financial coaching

**Visual Layout:**
```
┌─────────────────────────────────┐
│  Financial Coach           [W]  │  ← Header with avatar
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ [W] Good morning! Here's  │  │  ← Coach message bubble
│  │ your June summary: you've │  │    (left-aligned, dark bg)
│  │ saved $1,352 — 26% of     │  │
│  │ your income. Well done!   │  │
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │ [W] Heads up — you've     │  │
│  │ spent 91% of your dining  │  │
│  │ budget with 9 days left.  │  │
│  │ Consider meal prepping!   │  │
│  └───────────────────────────┘  │
│                                 │
│  ─── Ask the Coach ───          │
│  [How am I doing?] [Save more?] │  ← Quick reply chips
│  [Next bill?] [My net worth?]   │
└─────────────────────────────────┘
```

---

### Modal Screen: Add Transaction

**Purpose:** Primary data entry point — should feel fast and frictionless

**Visual Layout:**
```
┌─────────────────────────────────┐
│  [×]              [Save]        │  ← Header controls
├─────────────────────────────────┤
│  [Income] [Expense] [Transfer]  │  ← Type selector
├─────────────────────────────────┤
│          $0.00                  │  ← Large amount display
│       [1][2][3]                 │  ← Numeric keypad
│       [4][5][6]                 │
│       [7][8][9]                 │
│       [.][0][⌫]                 │
├─────────────────────────────────┤
│  Category  ← scroll →           │
│  [Food] [Transport] [Shop] ...  │
├─────────────────────────────────┤
│  Account    [Chase Checking ▼]  │
│  Date       [Today ▼]           │
│  Description [What was this?]   │
│  Tags        [+ Add tag]        │
│  Notes       [Optional...]      │
└─────────────────────────────────┘
```

---

## 10. Navigation Flow

```
App Launch → Database Init → Dashboard

Dashboard
├── [+ Transaction] → add-transaction modal
├── [Transfer] → add-transaction modal (transfer type)
├── [Budget] → budget tab
├── [Goals] → goals modal
├── Account Card → filtered transactions view
├── Bill Alert → bills modal
└── Transaction Row → edit transaction modal

Bottom Tab Bar
├── Dashboard (home)
├── Transactions
│   ├── Search/Filter
│   ├── [+] → add-transaction modal
│   └── Row tap → edit transaction modal
├── Budget
│   ├── Month navigation
│   ├── Category card → category transactions
│   └── Bills tab
├── Analytics
│   └── Time range selection
└── Coach
    └── Quick reply chips

From Dashboard Header Menu (or Settings gear icon)
├── Accounts modal
├── Goals modal
├── Wishlist modal
├── Bills modal
├── Debt modal
├── Investments modal
├── Journal modal
├── Categories modal
└── Settings modal
```

---

## 11. Feature Breakdown

### Module Priority Matrix

| Module | Priority | Complexity | Value |
|--------|----------|------------|-------|
| Transaction CRUD | Critical | High | High |
| Account management | Critical | Medium | High |
| Dashboard | Critical | High | High |
| Budget tracking | High | Medium | High |
| Analytics/Charts | High | High | High |
| Financial coach | High | High | High |
| Savings goals | High | Medium | High |
| Bills tracking | High | Low | Medium |
| Debt tracking | Medium | Low | Medium |
| Investment tracking | Medium | Low | Medium |
| Daily journal | Medium | Low | Medium |
| Wishlist | Low | Low | Medium |
| Data export | Low | Low | Low |
| Categories management | Medium | Low | Medium |

### Coach Engine — Insight Categories

The offline coach generates insights from 20+ rule patterns:

| Pattern | Trigger | Example Message |
|---------|---------|-----------------|
| Budget overspend | Category > 90% budget | "You've spent 91% of your dining budget with 9 days remaining." |
| Budget milestone | Category reaches 50% | "You're halfway through your shopping budget for June." |
| Budget perfect | Category < 70% at month end | "Great discipline! You used only 65% of your entertainment budget." |
| Savings praise | Savings rate > 20% | "You saved 23% of your income this month — above the recommended 20%." |
| Savings warning | Savings rate < 10% | "Your savings rate this month is 8%. Try to reach 20% by reducing discretionary spending." |
| Bill reminder | Bill due in 3-7 days | "Your Netflix subscription ($15.99) is due in 3 days." |
| Bill overdue | Bill due in 0-1 days | "Your internet bill ($79.99) is due today!" |
| Goal progress | Goal > 50% complete | "You're 67% of the way to your vacation fund goal!" |
| Goal projection | Regular savings trend | "At your current savings rate, you'll reach your emergency fund goal in 4 months." |
| Goal completed | Goal 100% | "Congratulations! You've fully funded your emergency fund. Time to start a new goal!" |
| Debt milestone | Debt repaid > 25% | "You've paid off 34% of your car loan. Keep it up!" |
| Debt paid off | Debt 100% | "You're completely debt-free on your student loan! That's a huge financial milestone." |
| Monthly summary | Start of new month | "June summary: Income $5,200, Expenses $3,847, Saved $1,353 (26%). Excellent month!" |
| Net worth increase | Net worth up > 5% MoM | "Your net worth grew by 8.3% this month. Outstanding progress!" |
| Consistent tracking | 7+ days streak | "You've tracked every transaction for 7 days straight. Financial awareness is key!" |
| Category spike | Category 2x vs. last month | "Your entertainment spending is double last month. Worth reviewing?" |
| Investment nudge | No investments this month | "You haven't logged any investments this month. Even $50 compounds over time." |
| Journal prompt | No journal entry today | "How are you feeling financially today? A quick reflection keeps you grounded." |
| Wishlist savings | Wishlist item affordability | "With your current savings rate, you could afford that MacBook Pro in 2.5 months." |
| Annual review | January 1st | "New year, new financial goals! Let's review what you accomplished last year." |

---

## 12. Technology Stack

### Core Framework

| Technology | Version | Purpose |
|------------|---------|---------|
| React Native | 0.81.5 | Cross-platform mobile framework |
| Expo | SDK 54 | Development platform + native modules |
| Expo Router | 6.0.x | File-based navigation (Next.js-style) |
| TypeScript | 5.9.x | Type-safe development |

### UI & Design

| Technology | Purpose |
|------------|---------|
| React Native StyleSheet | Core styling system |
| expo-linear-gradient | Gradient backgrounds and card accents |
| expo-blur | Glassmorphism / frosted glass effects |
| react-native-reanimated | Performant animations and micro-interactions |
| react-native-gesture-handler | Swipe gestures (swipe-to-delete) |
| expo-haptics | Tactile feedback on interactions |
| @expo/vector-icons (Ionicons, Feather) | Icon system |
| react-native-svg | Custom SVG chart components |
| expo-symbols | SF Symbols for iOS 26+ native icons |

### Data & State

| Technology | Purpose |
|------------|---------|
| expo-sqlite | Local SQLite database (offline-first) |
| React Context | Global state management (FinanceContext) |
| useState | Local component state |

### Navigation

| Technology | Purpose |
|------------|---------|
| expo-router (Stack) | Root navigation with modal support |
| expo-router (Tabs) | Bottom tab bar navigation |
| expo-router/unstable-native-tabs | Liquid glass tabs on iOS 26+ |
| expo-glass-effect | iOS 26 liquid glass detection |

### Developer Experience

| Technology | Purpose |
|------------|---------|
| pnpm workspaces | Monorepo package management |
| Babel | JavaScript compilation |
| ESLint / TypeScript strict | Code quality |

---

## 13. Offline Data Strategy

### Storage Architecture

Wealthly uses **expo-sqlite** with the synchronous API (`openDatabaseSync`) for immediate, predictable data access without async complexity.

```typescript
// Initialization pattern
const db = SQLite.openDatabaseSync('wealthly.db');

// Enable WAL mode for performance and reliability
db.execSync('PRAGMA journal_mode = WAL');
db.execSync('PRAGMA foreign_keys = ON');

// Synchronous read (fast, no await needed)
const transactions = db.getAllSync<Transaction>(
  'SELECT * FROM transactions WHERE date >= ? ORDER BY date DESC',
  [startDate]
);

// Write within transaction (atomic)
db.withTransactionSync(() => {
  db.runSync('INSERT INTO transactions ...', [...values]);
  db.runSync('UPDATE accounts SET balance = ? WHERE id = ?', [newBalance, accountId]);
});
```

### Data Lifecycle

1. **First Launch:** Database initialized, schema created, seed data inserted
2. **Normal Use:** All reads/writes go directly to SQLite — no caching layer needed
3. **Context Refresh:** After any write, `refreshAll()` re-queries all tables and updates React state
4. **App Restart:** Database persists in app sandbox; data survives reinstall on same device (iOS backup-eligible)

### Data Integrity Patterns

- **Atomic Transfers:** Account balance updates and transaction inserts are always wrapped in a single SQLite transaction
- **Cascade Deletes:** When an account is deleted, associated transactions are deleted via SQL CASCADE
- **Validation First:** All input validation occurs in React before any SQLite write
- **WAL Mode:** Write-Ahead Logging provides crash safety — no data loss on unexpected termination

### Backup & Export

- iOS automatic backup via iCloud (app data included by default)
- In-app CSV export generates formatted data for all 10 entity types
- Export displayed in-app (user can share/copy to any destination)

### Privacy Architecture

- **Zero network calls:** No analytics, no telemetry, no crash reporting
- **No permissions required:** Only storage access (sandboxed to app)
- **Local analysis only:** Financial coach runs entirely on device using SQLite queries
- **No account required:** App works from first launch with no registration

---

## 14. Security Considerations

### Data Security

**SC-01: App Sandbox Isolation**
All SQLite data is stored in the app's private container directory, inaccessible to other apps (iOS/Android enforced).

**SC-02: No Network Transmission**
No financial data is ever sent over a network. The app has no network permission requests. Zero third-party SDKs with analytics.

**SC-03: SQL Injection Prevention**
All SQLite queries use parameterized statements (prepared statements via expo-sqlite's `runSync`/`getAllSync` parameter arrays). No string concatenation in SQL.

**SC-04: Input Validation**
All user inputs are validated (type, range, required fields) before any database write. Numeric inputs are parsed and range-checked before storage.

**SC-05: Device-Level Security**
The app relies on the device's own security model (Face ID / Touch ID / PIN) for data protection at rest. Optional: future enhancement to add in-app biometric lock.

**SC-06: Export Safety**
Data exports are presented in-app or shared via the native share sheet. No automatic cloud uploads.

### Privacy Considerations

**PC-01: No Analytics**
Zero third-party analytics SDKs (no Firebase, Segment, Mixpanel, Amplitude).

**PC-02: No Crash Reporting**
No Sentry, Bugsnag, or similar. Error boundaries catch crashes gracefully without external reporting.

**PC-03: No Advertising**
No ad SDKs of any kind.

**PC-04: GDPR / CCPA Compliance**
Since no data leaves the device, the app naturally complies with data protection regulations. "Delete all data" feature is provided for user control.

---

## 15. Design Principles

### P1: Dark-First, Light-Optional

The primary design is crafted for dark mode — deep navy backgrounds (#0A0E1A), charcoal card surfaces (#131929), and emerald green (#10B981) as the primary action color. The light theme provides equal polish in bright environments. Color tokens are defined once in `constants/colors.ts` and applied universally via the `useColors()` hook.

### P2: Information Density Without Clutter

Inspired by Bloomberg Terminal and Coinbase Pro, the app prioritizes data density — users see maximum financial information per screen without scrolling. Cards are compact. Typography hierarchy is strict: large for key numbers, small for labels. Whitespace is deliberate, not generous.

### P3: Mobile-Native Patterns Only

No web-inspired layouts. Horizontal scrolling account cards, swipe-to-delete, bottom sheet modals, haptic feedback, native tab bars with liquid glass on iOS 26+. Every interaction feels native to the platform.

### P4: Motion with Purpose

Animations serve clarity: progress bars animate when values change, coach messages slide in with staggered timing, the net worth card pulses subtly on load. react-native-reanimated is used exclusively — no Animated API. Transitions are 200-300ms, never gratuitous.

### P5: Glassmorphism Accented, Not Dominant

Expo-linear-gradient provides accent depth on cards. expo-blur creates frosted glass in modal backgrounds. These effects are tasteful accents, not the entire visual language — overuse produces visual noise.

### P6: Icon-First UI

Buttons use icons, not text (checkmark vs "Done", × vs "Cancel"). @expo/vector-icons provides a consistent Ionicons icon system throughout. No emojis anywhere in the app.

### P7: Color Semantics

Colors carry specific financial meaning:
- **Emerald (#10B981)** — Income, positive, savings, success
- **Red (#EF4444)** — Expense, overspending, debt, danger
- **Indigo (#6366F1)** — Savings, accent, investment, secondary actions
- **Amber (#F59E0B)** — Warning, approaching budget limit, due soon
- **Muted** — Labels, timestamps, secondary information

### P8: Forgiving Interactions

Deletes require confirmation. Edits are non-destructive until saved. Budget overages show warnings, not hard blocks. The app is permissive — users are trusted to manage their own data.

---

## 16. Development Roadmap

### Phase 1 — Core Foundation (MVP)
- SQLite schema and seeding
- FinanceContext with full CRUD
- Dashboard screen
- Transaction add/edit/delete
- Account management (2-3 accounts)
- Budget overview
- 5-tab navigation

**Milestone:** User can track income/expenses, view dashboard, and set budgets

### Phase 2 — Financial Intelligence
- Analytics charts (all 4 chart types)
- Financial coach with 10+ insight categories
- Savings goals with progress tracking
- Bills tracking and reminders

**Milestone:** App provides intelligent insights from real user data

### Phase 3 — Complete Feature Set
- Debt tracking module
- Investment portfolio tracker
- Daily journal with mood tracking
- Wishlist with priority management
- Categories management
- Advanced search and filtering

**Milestone:** All 16 feature modules functional

### Phase 4 — Polish & Optimization
- Smooth animations on all screens
- Haptic feedback on all interactions
- Empty states for all lists
- Error boundaries and graceful degradation
- Dark/light mode perfection
- Data export (CSV)

**Milestone:** Production-ready quality

---

## 17. Future Enhancements

### Near-Term (3-6 months)

**In-App Biometric Lock**
Add optional Face ID / Touch ID app lock using expo-local-authentication for users who share devices.

**Recurring Transaction Templates**
Pre-fill transactions from templates (salary on the 1st, rent on the 15th) based on historical patterns.

**Widget Support**
Home screen widget showing today's balance and recent transactions (requires native build).

**Notification Reminders**
Local push notifications for bill due dates and budget threshold alerts using expo-notifications.

**iCloud Sync**
Optional encrypted iCloud synchronization for multi-device access, preserving the offline-first privacy model.

### Medium-Term (6-12 months)

**Advanced Financial Projections**
Monte Carlo simulation for retirement projections and compound interest calculators.

**Receipt Scanning**
Camera-based receipt OCR using expo-camera + ML Kit to auto-fill transaction amounts and descriptions.

**Spending Forecasting**
Machine learning model (TensorFlow Lite) running on-device to predict next month's spending by category.

**Multi-Currency with Exchange Rates**
Offline-cached exchange rates with manual refresh for multi-currency account holders.

**Financial Goal Planning**
Scenario modeling: "What if I cut dining spending by 30%?" — visualize the impact on savings goals.

### Long-Term (12+ months)

**Apple Watch Companion**
Quick transaction logging from the wrist using watchOS companion app.

**iPad Optimized Layout**
Split-view layout optimized for the iPad's larger canvas — dashboard + transactions side by side.

**Family Mode**
Multiple user profiles on one device with separate financial tracking and shared budget categories.

**Financial Report PDF Export**
Formatted PDF reports (monthly/annual) with all charts embedded, shareable via native share sheet.

**Siri Shortcuts Integration**
"Hey Siri, add a $15 coffee expense" via Siri Shortcuts integration for hands-free transaction logging.

---

## Appendix: Preset Category Icons Reference

| Category | Ionicons Name | Color |
|----------|--------------|-------|
| Food & Dining | restaurant-outline | #EF4444 |
| Transportation | car-outline | #6366F1 |
| Shopping | bag-handle-outline | #EC4899 |
| Entertainment | film-outline | #8B5CF6 |
| Health & Fitness | fitness-outline | #EF4444 |
| Housing | home-outline | #10B981 |
| Education | school-outline | #F59E0B |
| Travel | airplane-outline | #06B6D4 |
| Utilities | flash-outline | #F97316 |
| Subscriptions | repeat-outline | #84CC16 |
| Salary | briefcase-outline | #10B981 |
| Freelance | laptop-outline | #6366F1 |
| Investments | trending-up-outline | #F59E0B |
| Gifts | gift-outline | #8B5CF6 |
| Personal Care | person-outline | #EC4899 |
| Other | ellipsis-horizontal | #94A3B8 |

---

*Document Version: 1.0*
*Prepared for: Wealthly Personal Finance App*
*Date: June 30, 2026*
*Status: Final Design Specification*
