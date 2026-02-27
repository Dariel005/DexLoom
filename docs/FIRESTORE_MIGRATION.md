# Firestore Migration

## Purpose
Migrate local `.data` records into Firestore for production usage without losing local data.

This script supports:
- Social store docs (`social_store/*`)
- Users (`pokedexUsers/*`)
- Profiles (`pokedexProfiles/*`)
- Favorites (`pokedexFavorites/*`)

## Script
- `scripts/migrate-data-to-firestore.mjs`

## Commands
- Preview (dry-run):
  - `npm run migrate:firestore:preview`
- Apply migration:
  - `npm run migrate:firestore:apply`

## Required env vars (for apply)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

Notes:
- The script auto-loads `.env.local` and `.env`.
- `FIREBASE_PRIVATE_KEY` supports escaped newlines (`\\n`).

## Options
- `--apply`: perform writes (default mode is dry-run)
- `--social-only`: migrate only social files to `social_store`
- `--no-users`: skip `users.json`
- `--no-profiles`: skip `profiles.json`
- `--no-favorites`: skip `favorites.json`
- `--data-dir=<path>`: override source directory (default: `POKEDEX_DATA_DIR` or `.data`)

## Safety
- Dry-run by default.
- Script prints row counts per source file.
- It blocks apply when a social store doc is too large for Firestore limits.
- Each apply run creates a log document in `data_migrations/<runId>`.
