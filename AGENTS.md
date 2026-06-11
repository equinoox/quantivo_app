## Project name

Quantivo

## Project purpose

This project is a complete rework of the existing Bitolj inventory application.

The goal is to build a modern, maintainable, fast, and scalable React Native application for inventory management. The app should initially work locally using SQLite, while keeping the architecture open for future cloud/server synchronization.

## Main technology stack

Use the following technologies:

- React Native
- Expo
- Expo Router
- TypeScript
- NativeWind / TailwindCSS
- SQLite using expo-sqlite
- Drizzle ORM for typed local database access
- Zustand for lightweight global state
- Zod for validation
- React Hook Form for forms
- React Native Toast Message for toast notifications
- Lucide React Native for icons
- Expo Secure Store for local session/auth storage
- Expo Crypto for local/demo password hashing

Do not add paid services.

Do not add a cloud provider yet.

Do not add Firebase, Supabase, Appwrite, or a custom backend unless explicitly requested later.

## Architecture style

Use feature-based architecture.

The application should be organized by business features, not only by technical file type.

Preferred structure:

```txt
src/
  app/
  features/
  shared/

The app folder contains routing only.

The features folder contains feature-specific logic.

The shared folder contains reusable UI, common types, infrastructure, constants, hooks, and utilities.