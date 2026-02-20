# Authentication Flow (DanceStudioApp)

This document summarizes the end-to-end authentication flow in this project
as implemented in the app and Supabase configuration.

## Overview

The app uses Supabase Auth with session persistence in `AsyncStorage`.
Auth state is centralized in `AuthProvider`, and routing is gated via Expo Router.

Key files:
- `src/lib/supabase.js`
- `src/context/AuthContext.js`
- `app/_layout.js`
- `app/index.js`
- `app/(tabs)/_layout.js`
- `app/(auth)/*`

## Supabase Client Configuration

File: `src/lib/supabase.js`

- Uses `createClient` from `@supabase/supabase-js`
- Session persisted in `AsyncStorage` via `auth.storage`
- `autoRefreshToken: true`
- `persistSession: true`
- `detectSessionInUrl: false`
- Uses safe storage wrapper for web SSR safety

## Auth Provider (Central State)

File: `src/context/AuthContext.js`

State:
- `user`: Supabase user
- `session`: Supabase session
- `loading`: true while initial session is fetched
- `userInfo`: record from `"Users Info"` table

Initialization:
- `supabase.auth.getSession()` runs on mount
- `supabase.auth.onAuthStateChange` listens for auth changes
- Both update `user`, `session`, `userInfo`, and `loading`

User Profile:
- `fetchUserInfo(userId)` reads `"Users Info"` by `user_id`
- `signUpWithEmail` also upserts `"Users Info"` for the new user

## Sign In

File: `app/(auth)/sign-in.js` (uses `useAuth().signInWithEmail`)

Flow:
1. `supabase.auth.signInWithPassword({ email, password })`
2. On success, Supabase session is stored
3. `onAuthStateChange` updates `user` and `userInfo`
4. `app/index.js` redirects to `/(tabs)` when `user` exists

## Sign Up

File: `app/(auth)/sign-up.js` (uses `useAuth().signUpWithEmail`)

Flow:
1. `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
2. If email confirmation is disabled, a session is created immediately
3. App upserts into `"Users Info"` with `user_id`, `name`, `full_name`, `current_balance`
4. `onAuthStateChange` updates `user` and `userInfo`
5. `app/index.js` redirects to `/(tabs)` when `user` exists

## Reset Password

File: `app/(auth)/forgot-password.js` (uses `useAuth().resetPassword`)

Flow:
1. `supabase.auth.resetPasswordForEmail(email)`
2. Email is sent by Supabase

## Sign Out

Files:
- `src/context/AuthContext.js`
- `app/(tabs)/profile.js`

Flow:
1. Local state is cleared: `user`, `session`, `userInfo`
2. `supabase.auth.signOut({ scope: 'local' })` clears stored session
3. App navigates to `/(auth)` (on web uses `window.confirm`)
4. `app/(tabs)/_layout.js` blocks tabs if `user` is null

## Routing & Auth Gates

File: `app/_layout.js`
- Wraps app in `AuthProvider`
- Handles splash screen based on `loading`

File: `app/index.js`
- If `loading` -> activity spinner
- If `user` -> `<Redirect href="/(tabs)" />`
- Else -> `<Redirect href="/(auth)" />`

File: `app/(tabs)/_layout.js`
- If `loading` -> activity spinner
- If no `user` -> `<Redirect href="/(auth)" />`
- Else -> show tab navigator

File: `app/(auth)/index.js`
- Landing page with Sign In / Sign Up buttons

## Database Integration

Tables involved:
- `"Users Info"`: user profile & balance
- `transactions`: top-up and purchases

Relevant RPC:
- `topup_balance(p_amount NUMERIC)` returns JSON `{ ok, new_balance?, error? }`
- `purchase_bundle(p_bundle_id UUID)` returns table with `{ ok, message }`

RLS Policies (from migrations):
- `"Users Info"`: users can read/update/insert their own row
- `transactions`: users can read/insert their own rows
- `enrollments`: users can read/insert their own rows

## Notes / Operational Considerations

- Web uses `window.confirm` for sign-out confirmation (alerts don’t render on web)
- `userInfo` is refreshed via `refreshUserInfo()` in key flows
- When Supabase migrations are out of sync, errors can surface in RPC calls or update triggers

