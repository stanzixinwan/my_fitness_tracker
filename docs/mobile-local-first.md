# Local-First Data Path

This project now routes app data through a `FitnessRepository` interface instead of
binding product logic directly to Prisma. That keeps the current Next.js app working
while making room for browser IndexedDB and Expo SQLite later.

## Current Implementations

- `src/lib/data/repositories/prisma-repository.ts`: server-side Postgres/Prisma storage.
- `src/lib/data/repositories/sample-repository.ts`: in-memory local fallback for development
  when `DATABASE_URL` is not configured.
- `src/lib/data/app-service.ts`: shared service that computes nutrition targets and daily
  remaining macros from repository records.

## Web Local-First Path

For true browser local-first storage, add an `IndexedDbRepository` that implements
`FitnessRepository`.

Important constraint: IndexedDB only runs in the browser, so pages that read/write browser
local data must move to client components or use a client-side data provider. In that mode,
Next API routes should be treated as optional sync/LLM endpoints, not as the primary database.

Recommended browser stack:

- IndexedDB via `idb` or Dexie.
- JSON export/import for user-controlled backup.
- A clear local data action that deletes all IndexedDB stores.

## Expo SQLite Path

For iOS/Android, implement the same `FitnessRepository` using `expo-sqlite`.

Suggested tables:

- `profile`
- `body_metrics`
- `goals`
- `diet_preferences`
- `food_entries`
- `plan_suggestions`

Use the platform-neutral record shapes in `src/lib/data/types.ts`. Keep enum values in the
friendly string form used by the app, such as `male`, `moderate`, and `breakfast`.

## Optional Cloud Sync

Prisma/Postgres should become an optional sync target. The app can keep local SQLite as the
source of truth, then push/pull snapshots or changes when the user enables sync.

Minimum user data controls before shipping local-first:

- Export all local data as JSON.
- Import from a JSON backup.
- Clear all local data.
- Explain exactly what gets sent to the LLM when generating a plan.
