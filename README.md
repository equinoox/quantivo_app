# Quantivo

Quantivo is the clean rework scaffold for the Bitolj inventory application. The current goal is foundation only: routing, architecture, local database preparation, shared UI, auth scaffolding, and future sync extension points.

## Run The App

```bash
npm install
npm run start
```

Then open the project in Expo Go, Android emulator, iOS simulator, or web:

```bash
npm run android
npm run ios
npm run web
```

## Architecture

The app uses a feature-based structure under `src/`.

```text
src/
  app/                Expo Router routes and layouts
  features/           Domain features with hooks, services, types, validation
  shared/             Reusable UI, constants, storage, database, sync, errors
```

Screens should stay thin. UI belongs in shared or feature components, domain operations belong in feature services/hooks, and database details belong in `src/shared/lib/db`.

## Folder Structure

```text
src/app
src/features/auth
src/features/inventory
src/features/products
src/features/users
src/features/reports
src/shared/components
src/shared/constants
src/shared/hooks
src/shared/lib
src/shared/types
```

## Current Limitations

- Authentication is only a local scaffold.
- Database schema is prepared, but migrations and real CRUD workflows are not implemented.
- Screens are placeholders.
- Sync is local-only with a remote adapter placeholder.
- Reports, inventory transactions, product management, and user administration are not functional yet.

## Future Sync Plan

Quantivo is designed offline-first with SQLite and Drizzle. The sync layer starts with a generic `SyncAdapter` interface so a future server/cloud adapter can be added without rewriting screens or feature services.
