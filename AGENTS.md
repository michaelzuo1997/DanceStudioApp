# AGENTS.md

## Cursor Cloud specific instructions

### Project overview
React Native / Expo (SDK 52) mobile app for a dance studio. Uses a cloud-hosted Supabase (PostgreSQL + Auth) backend. Single-product repo, not a monorepo.

### Running the app
- **Dev server (web):** `npx expo start --web --port 8081` — best option for headless/cloud environments.
- The app requires a `.env` file with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Values are in `eas.json` under build profiles.
- Expo auto-loads `.env` (see `env: load .env` in output). No extra dotenv setup needed.

### Lint & test
- `npm run lint` requires an `eslint.config.js` (ESLint v9 flat config). No config file exists yet; the CI uses `--if-present` so this is expected to fail.
- `npm test` runs Jest via `jest-expo`. No test files exist yet; exits with code 1 (use `--passWithNoTests` to suppress).

### Known issues
- **Supabase signup 500 error:** The cloud Supabase instance returns "Database error saving new user" on `auth/v1/signup`. The `handle_new_user()` trigger on `auth.users` is failing, likely due to schema drift between migrations and the live database. This is a backend/Supabase admin issue, not a frontend bug.

### Package manager
npm (lockfile: `package-lock.json`). Use `npm ci` for deterministic installs.
