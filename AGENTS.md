# Quantivo — AGENTS.md

## Project name

Quantivo

## Project purpose

Quantivo is a complete rework of the existing Bitolj inventory application.

The goal is to build a modern, maintainable, fast, scalable, and commercial-ready React Native application for inventory management.

The app is still in active development and is not published yet. There are no real production users at the moment, but the codebase should gradually be prepared for future commercial use.

The app should initially work locally using SQLite as the local database, while keeping the architecture open for future cloud/server synchronization if explicitly requested later.

---

## Main technology stack

Use the following technologies:

* React Native
* Expo
* Expo Router
* TypeScript
* NativeWind / TailwindCSS
* SQLite using expo-sqlite
* Drizzle ORM for typed local database access
* Zustand for lightweight global state
* Zod for validation
* React Hook Form for forms
* React Native Toast Message for toast notifications
* Lucide React Native for icons
* Expo Secure Store for local session/auth storage
* Expo Crypto for local/demo security utilities

Do not add paid services.

Do not add a cloud provider yet.

Do not add Firebase, Supabase, Appwrite, or a custom backend unless explicitly requested later.

Do not add unnecessary dependencies. Prefer using the existing stack.

---

## Core architecture style

Use Feature Driven Architecture.

The application must be organized by business features, not only by technical file type.

Main structure:

```txt
src/
  app/
  features/
  shared/
```

### Folder responsibilities

```txt
src/app
```

Contains only Expo Router route files, route layouts, and minimal route wrappers.

```txt
src/features
```

Contains feature-specific UI, hooks, services, validation, domain rules, types, and feature-level logic.

```txt
src/shared
```

Contains reusable UI, constants, utilities, storage, database infrastructure, global types, shared hooks, shared errors, and shared app infrastructure.

---

## Feature-driven routing rule

The `src/app` folder must stay as thin as possible.

Files inside `src/app` are only allowed to:

* define Expo Router route files
* define Expo Router layouts
* call and return feature-level screen/tab components
* apply route-level wrappers such as authentication or role protection when necessary

Do not place the following inside `src/app`:

* business logic
* form logic
* database calls
* service calls
* calculations
* large UI markup
* feature-specific state
* feature-specific hooks
* feature-specific modals or forms

Every route file should delegate to a component from the correct feature folder.

Examples:

```tsx
// src/app/(tabs)/settings.tsx
import { SettingsTab } from "@/features/settings/components/SettingsTab";

export default function SettingsRoute() {
  return <SettingsTab />;
}
```

```tsx
// src/app/(auth)/login.tsx
import { LoginScreen } from "@/features/auth/components/LoginScreen";

export default function LoginRoute() {
  return <LoginScreen />;
}
```

```tsx
// src/app/(setup)/language.tsx
import { SetupLanguageScreen } from "@/features/setup/components/SetupLanguageScreen";

export default function SetupLanguageRoute() {
  return <SetupLanguageScreen />;
}
```

```tsx
// src/app/protected/workers-management.tsx
import { ProtectedRoute } from "@/shared/components/navigation/ProtectedRoute";
import { WorkersManagementScreen } from "@/features/workers/components/WorkersManagementScreen";

export default function WorkersManagementRoute() {
  return (
    <ProtectedRoute allowedRoles={["admin"]}>
      <WorkersManagementScreen />
    </ProtectedRoute>
  );
}
```

---

## Preferred feature structure

Each feature should keep its own components, hooks, services, validation, types, and domain rules.

Preferred pattern:

```txt
src/features/<feature>/
  components/
  hooks/
  services/
  validation/
  types/
  domain/
  data/
```

Use only the folders that are actually needed. Do not create empty folders just to match the pattern.

Examples:

```txt
src/features/auth/
  components/
  hooks/
  services/
  validation/
  types/

src/features/setup/
  components/
  hooks/
  services/
  validation/
  types/

src/features/products/
  components/
  hooks/
  services/
  validation/
  types/
  domain/

src/features/inventory/
  components/
  hooks/
  services/
  validation/
  types/
  domain/
```

---

## Screen composition rule

Screens and tabs should be composed from smaller components when it improves readability.

A screen-level component may look like this:

```txt
SettingsTab
  -> SettingsHeader
  -> WorkspaceSettingsCard
  -> LanguageSettingsCard
  -> SecuritySettingsCard
```

Keep feature-specific components inside the same feature folder.

Move only truly reusable UI to `src/shared/components`.

Do not move feature-specific UI to `shared` just because it is a component.

---

## Business logic rule

Business logic must not live in route files or large UI components.

Use this separation:

```txt
Route file
  -> only renders feature screen/tab component

Feature screen/tab component
  -> coordinates UI composition

Feature hook
  -> handles screen state, events, loading, and calls services

Feature service
  -> handles business operations and database operations

Feature validation
  -> validates input with Zod

Feature domain
  -> contains business rules, calculations, constants, and pure functions
```

Example:

```txt
src/app/(tabs)/products.tsx
  -> ProductsTab

src/features/products/components/ProductsTab.tsx
  -> uses useProducts

src/features/products/hooks/useProducts.ts
  -> calls products.service

src/features/products/services/products.service.ts
  -> handles product business/database logic

src/features/products/validation/product.schemas.ts
  -> validates product input
```

---

## Shared folder rule

Use `src/shared` only for reusable and cross-feature code.

Good candidates for `shared`:

* generic buttons
* generic modals
* toast provider
* error boundary
* app colors
* route constants
* role constants
* database client
* migration runner
* secure storage wrappers
* reusable formatting utilities
* reusable ID generator
* shared error types
* shared result types

Do not place feature-specific business logic in `shared`.

If code belongs only to one feature, keep it inside that feature.

---

## UI and styling rules

Reuse existing shared components whenever possible.

Create a new component only when it improves structure, readability, or reuse.

Do not redesign existing screens unless explicitly requested.

Do not change existing UI behavior unless explicitly requested.

Use NativeWind/Tailwind classes consistently.

Keep styles readable and avoid unnecessary abstraction.

For confirm dialogs, errors, toast notifications, buttons, modals, and repeated UI patterns, use existing shared components where available.

---

## i18n rule

For every new UI text, error message, label, title, button, or visible message, add translations in both:

* English
* Serbian

Do not hardcode visible text directly in components if the project already uses i18n for that area.

Services should return error codes or structured errors when possible.

UI should map error codes to translated messages.

---

## Authentication and authorization rules

Keep authentication local-first unless explicitly requested otherwise.

Use Expo Secure Store for local session/auth storage.

Use Expo Crypto for local security utilities when needed.

Do not introduce backend authentication, Firebase, Supabase, Appwrite, or cloud auth unless explicitly requested.

Protected screens must use centralized route protection.

Role-based access should be explicit and easy to understand.

The current roles are:

```txt
admin
manager
worker
```

Use lowercase role values internally.

Use labels only for UI display.

Development-only tools must never be exposed in production builds.

---

## Database rules

Use SQLite with Drizzle ORM.

Database schema lives in the shared database layer.

Database access should be structured and predictable.

Do not drop, reset, or destroy local data unless the task explicitly asks for development reset behavior.

Even though the app is not published yet and has no real users, database changes should still be written carefully so the project gradually becomes commercial-ready.

When changing schema or migrations:

* avoid destructive changes unless explicitly requested
* preserve existing local development data when reasonable
* keep migrations incremental
* keep schema and migration logic aligned
* do not silently delete user, product, inventory, or settings data
* keep database code lightweight and readable

---

## Development database tools

Development database reset/debug tools are allowed only for development.

They must be protected by:

```txt
__DEV__ === true
```

and by appropriate admin-only route protection.

Development-only tools must not be accessible in production builds.

---

## Validation rules

Use Zod for validating user input and service input.

Validation should live inside the relevant feature folder:

```txt
src/features/<feature>/validation/
```

Do not duplicate validation rules across screens.

Do not rely only on UI input restrictions. Important business rules should also be enforced in services and/or database constraints.

---

## Error handling rules

Use consistent error handling.

Prefer structured errors, error codes, or shared result types instead of random string errors.

Avoid exposing raw database or internal errors directly to the user.

UI should show user-friendly translated messages.

Services should keep errors predictable and easy to handle.

---

## State management rules

Use Zustand for lightweight global state.

Keep global state minimal.

Do not put everything into global stores.

Use local component state for local UI-only behavior.

Use feature hooks for feature screen state.

Use services for business/database operations.

---

## Code quality rules

Before making changes, always read this AGENTS.md file and follow the existing architecture.

Prefer small, focused, incremental changes over large rewrites.

Keep code lightweight, readable, and easy to maintain.

Do not duplicate utilities, constants, validation, error handling, or database logic.

If a shared solution already exists, reuse it.

Do not introduce new product features unless explicitly requested.

Do not add unnecessary abstractions.

Do not move code just for the sake of moving code.

Do not rename files, functions, or components unless it improves clarity or is required by the task.

Preserve existing behavior unless the task explicitly asks for behavior change.

---

## Refactoring rules

When refactoring:

* keep the app working exactly the same
* move code to the correct architectural location
* avoid changing business logic
* avoid changing UI behavior
* avoid large unrelated rewrites
* keep diffs focused
* prefer simple and readable code
* do not create too many tiny files unnecessarily

The main goal of refactoring is to make the codebase easier to scale, not to make it more complicated.

---

## Commercial readiness mindset

The app is still in development and not published yet.

There are no real production users at the moment.

However, the codebase should be written in a way that gradually prepares the app for future commercial use.

This means:

* stable architecture
* clear feature boundaries
* safe authentication and authorization direction
* careful database changes
* predictable error handling
* maintainable UI composition
* no development-only tools in production
* no unnecessary dependencies
* no rushed hacks that will be hard to remove later

Do not over-engineer as if the app already has thousands of users, but avoid decisions that would obviously block future scaling.

---

## After every change

After every change:

* run TypeScript typecheck
* fix all TypeScript errors
* verify imports
* verify routing still works
* verify no route file contains unnecessary business logic
* verify no new hardcoded UI text was added without i18n
* verify no development-only tool is exposed in production
* avoid unrelated changes

Use the existing project structure and naming style whenever possible.

---

## Default instruction for future work

For every new task, follow this default approach:

1. Read AGENTS.md.
2. Understand the existing feature structure.
3. Keep `src/app` thin.
4. Put feature UI inside the correct `src/features/<feature>/components` folder.
5. Put feature state/events inside feature hooks.
6. Put business/database logic inside feature services.
7. Put validation inside feature validation files.
8. Put reusable infrastructure inside `src/shared`.
9. Preserve existing behavior unless explicitly requested.
10. Keep the implementation lightweight, structured, and maintainable.
