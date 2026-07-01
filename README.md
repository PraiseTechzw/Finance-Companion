# Finance Companion

Finance Companion is a polished mobile finance application built with Expo and React Native. It is designed to help users manage personal finances with clarity and confidence through budgeting, transaction tracking, insights, and goal planning.

The application is built as a standalone mobile experience focused on usability, local data privacy, and a clean modern interface.

## Overview

Finance Companion provides a practical toolkit for everyday financial management, including:

- Tracking income and expenses
- Planning monthly budgets
- Managing recurring bills and subscriptions
- Reviewing financial analytics and reports
- Tracking savings goals, debt, and wishlists
- Securing the app with biometric protection

## Product Goals

- Make personal finance management simple and approachable
- Keep the experience fast and mobile-friendly
- Support local-first persistence without relying on a complex backend
- Deliver a modern interface suitable for daily use

## Technology Stack

- React Native
- Expo
- Expo Router
- TypeScript
- SQLite for local persistence
- Secure storage and biometric authentication support

## Project Structure

- app/ — screens, navigation routes, tabs, and modals
- components/ — reusable UI components and visual building blocks
- context/ — app state for finance and authentication
- lib/ — database and app logic layers
- assets/ — app visuals and resources
- scripts/ — build and helper scripts
- server/ — local serving utilities

## Getting Started

### Prerequisites

- Node.js
- npm or pnpm
- Expo CLI-compatible environment

### Installation

```bash
cd mobile
npm install --legacy-peer-deps
```

### Running the App

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

## App Workflow

1. Launch the app and create or view financial records.
2. Add transactions, bills, subscriptions, and goals.
3. Review analytics and budget progress from the main dashboard.
4. Use the app’s lock and security features to keep the experience private.

## Development Notes

- The app is intended to run as a self-contained mobile project.
- Local persistence is used for app data and offline-friendly behavior.
- The UI is organized around clear financial flows, making it easier to navigate and maintain.

## Contributing

Contributions are welcome. Please review [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines and submission standards.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

## Author

Created by Praise Masunga.

- GitHub: @praisetechzw
- Email: praisetechzw@gmail.com

## Support

For questions, feedback, or collaboration opportunities, contact the maintainer at praisetechzw@gmail.com.
