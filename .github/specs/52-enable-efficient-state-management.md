## Executive Summary & Scope

This feature migrates authenticated user state from ad-hoc `localStorage` persistence and component-level reducer state to TanStack Query. The goal is to treat the authenticated user profile as server state, centralize auth-related fetching and invalidation, and remove the current pattern of storing the full user object with JWT in browser storage.

### In scope

- Introduce TanStack Query (`@tanstack/react-query`) and wire a shared `QueryClientProvider`.
- Replace `AuthContext` storage responsibilities with query-driven session state.
- Fetch the signed-in user profile from `GET /user/profile` and cache it as the source of truth.
- Update login/logout flows to seed, refresh, invalidate, and clear auth-related queries.
- Gate protected routes on query state instead of `localStorage` hydration.
- Add loading, error, and unauthorized states for auth bootstrap and profile refresh.
- Define a staged migration path from legacy storage-based auth to query-driven auth.

### Out of scope

- Backend redesign of auth to cookies, refresh tokens, or OAuth flows.
- Rebuilding the existing login/register UX beyond auth state wiring.
- Changing inventory, medicine search, or dashboard data-fetching behavior.
- Introducing Redux, Zustand, or any second client-state library.
- Persisting sensitive auth data in new browser storage locations as the final target.

## Architecture & Component Design

### Proposed component / hook hierarchy

```text
main.tsx
└─ QueryClientProvider
   └─ AuthSessionProvider (thin bridge, optional during migration)
      └─ App
         ├─ PublicRoute/LoginPage
         └─ ProtectedRoute
            ├─ AuthBootstrapGate
            └─ AppLayout
               └─ Outlet
```

### Responsibilities

- `QueryClientProvider`: owns global cache, retry, and stale-time defaults.
- `useCurrentUserQuery`: fetches `/user/profile` and exposes auth session state.
- `useLoginMutation`: calls `/user/login`, seeds the user cache, and transitions into the app.
- `useLogoutMutation`: clears query cache and navigates back to `/`.
- `ProtectedRoute`: checks query status instead of reading from `localStorage`.
- `AuthBootstrapGate`: renders a full-page loading state while auth state is being resolved.
- `LoginPage`: remains mostly presentational, but consumes auth mutations instead of dispatching storage-backed state.

### Key props, state, and hooks

- `useCurrentUserQuery()`
  - Returns `data`, `isLoading`, `isFetching`, `error`, `isError`, `isSuccess`.
  - Uses query key `['auth', 'me']`.
- `useLoginMutation()`
  - Input: `{ email, password }`
  - On success: store token in the auth transport layer, then `invalidateQueries(['auth', 'me'])`.
- `useLogoutMutation()`
  - Clears auth cache and any transient token holder, then `removeQueries(['auth'])`.
- `AuthSessionProvider`
  - Optional adapter for incremental migration.
  - May expose derived values such as `isAuthenticated`, `user`, and `logout`.

## Data Flow & State Management

### Local state vs global state

- **Local state**
  - Form inputs, password visibility, OTP countdown, and transient UI toggles.
  - Modal state for login/register steps.
- **Global/server state**
  - Signed-in user profile.
  - Auth bootstrap status.
  - Session validity and 401 handling.

### Target data flow

1. User submits login form.
2. `useLoginMutation` posts to `POST /user/login`.
3. Backend returns `{ username, token, ... }`.
4. Client stores only the minimum required auth credential for API access during the session transition.
5. `useCurrentUserQuery` fetches `GET /user/profile`.
6. Query cache becomes the canonical source for user identity across the app.
7. Protected routes derive access from query state, not from `localStorage`.
8. Logout clears auth cache and redirects to `/`.

### API endpoints

#### `POST /user/login`

Request:

```json
{
  "email": "name@pharmacy.com",
  "password": "string"
}
```

Response:

```json
{
  "username": "alex",
  "token": "jwt-or-session-token"
}
```

#### `GET /user/profile`

Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "alex",
    "email": "name@pharmacy.com",
    "role": "pharmacist",
    "first_name": "Alex",
    "last_name": "Carter",
    "phone_number": null,
    "license_number": null,
    "status": "active"
  }
}
```

### Error and loading strategy

- Show a blocking auth bootstrap loader while the profile query is resolving.
- Show inline login/register errors from mutation failures.
- Treat `401` as a hard session reset: clear cache, clear any transient credential, and route to `/`.
- Retry profile queries conservatively; do not retry on `401` or validation failures.
- Surface empty/invalid profile payloads as session errors, not silent success.

## User Experience & Interaction Flow

### User journey

1. User opens the app.
2. App bootstraps auth by fetching the current profile.
3. If authenticated, the user lands in the protected layout immediately.
4. If not authenticated, the user sees the login/register screen.
5. After login, the UI transitions only after query state is ready.
6. Logout returns the user to the public entry screen and clears protected data.

### Visual and UX requirements

- Keep the existing Mantine-based layout and styling approach.
- Use a full-screen loading state during auth bootstrap to avoid route flicker.
- Keep login/register controls keyboard accessible and focus-visible.
- Preserve ARIA labels on inputs, buttons, and error messages.
- Ensure protected layout chrome remains responsive at tablet and mobile widths.
- Use clear disabled/loading affordances for submit buttons and logout actions.

## Implementation Strategy & Task Breakdown

### Phase 1: Foundation

1. Install TanStack Query and add a single `QueryClientProvider` near the app root.
2. Define query defaults for retries, stale time, and auth-sensitive cache behavior.
3. Create shared auth query keys and a typed `CurrentUser` model.

### Phase 2: Auth state migration

1. Add `useCurrentUserQuery` to own the `/user/profile` fetch.
2. Convert login to a mutation that seeds or refreshes the auth query cache.
3. Replace `AuthContext` storage-backed logic with query-derived session state.
4. Update `ProtectedRoute` to rely on query status plus a bootstrap gate.

### Phase 3: UX stabilization

1. Add auth loading skeletons and error states.
2. Preserve redirect behavior after successful login and invalid session handling.
3. Ensure logout clears all auth-related cache entries.
4. Remove obsolete `localStorage` reads once the migration is stable.

### Phase 4: Cleanup and hardening

1. Refactor legacy auth helpers out of `authcontext.tsx` if no longer needed.
2. Verify inventory and other authenticated requests still receive valid headers.
3. Document the remaining storage strategy, if any, and mark the backend cookie migration as future work.

### Edge cases to account for

- Network failure during bootstrap or login.
- `401` from `/user/profile` after token expiry.
- Login success but malformed profile response.
- Reload during in-flight login mutation.
- Multiple tabs with stale auth state.
- Empty profile data or missing token fields.
- Transition period where legacy storage may still exist.

### Step-by-step migration strategy

1. Introduce TanStack Query without changing auth behavior.
2. Move only the current-user read path to `useCurrentUserQuery`.
3. Convert login/logout to query mutations.
4. Stop using `localStorage` as the source of truth for the signed-in user.
5. Remove fallback storage reads after the new query flow is proven stable.
6. If backend support becomes available, move the token transport to an httpOnly cookie and fully eliminate persistent client-side auth storage.
