# Feature Specification: Efficient Authentication State Management

## 1. Executive Summary & Scope

### Summary
The app currently persists the authenticated user payload, including the JWT token, in `localStorage`. That works, but it is not the current best practice for SPA auth because `localStorage` is readable by JavaScript and increases the impact of XSS.

The recommended approach is:
- keep the access token short-lived and out of persistent browser storage
- store refresh/session credentials in `HttpOnly`, `Secure`, `SameSite` cookies when backend support exists
- keep only non-sensitive user profile data in React state or a global client store
- rehydrate the app by calling a profile/session endpoint on startup

This feature updates the app to use a safer auth-state model while preserving the existing login, logout, and protected-route behavior.

### In scope
- Replace `localStorage`-driven auth state as the primary source of truth
- Introduce a centralized auth store for the current user profile
- Hydrate auth state on app boot from the backend session/profile endpoint
- Keep protected routes and redirects working during refresh and navigation
- Define loading, error, and unauthorized states for auth bootstrapping
- Preserve the existing `username` + `token` compatibility only as a short migration path if needed

### Out of scope
- Full backend identity redesign
- Passwordless auth, MFA, or SSO
- Role/permission system redesign beyond current user profile fields
- Audit logging, account management, or token revocation UI
- Rewriting unrelated inventory or dashboard flows

## 2. User Stories & Acceptance Criteria

### Story 1
**As an authenticated user, I want my session to restore automatically after refresh so that I do not need to sign in again every time.**

Acceptance criteria:
- On app load, the client checks the session/profile endpoint before showing protected content
- While the session is being checked, protected routes show a loading state instead of flashing the login page
- If the session is valid, the user is restored into global auth state
- If the session is invalid or expired, the user is redirected to `/`
- Network failures show a retryable error state, not a blank screen

### Story 2
**As a user, I want my authentication data kept out of persistent browser storage so that my account is safer against client-side attacks.**

Acceptance criteria:
- The primary auth state is stored in memory through a global store/context
- Sensitive token data is not stored in `localStorage`
- If a cookie-based session is available, it is managed by the browser and not exposed to JavaScript
- Any temporary fallback storage is non-sensitive and explicitly time-limited
- Logout clears all client auth state immediately

### Story 3
**As a returning user, I want protected pages to stay accessible only when authenticated so that private data is not exposed.**

Acceptance criteria:
- Protected routes wait for auth initialization before deciding redirect vs render
- Unauthenticated users are redirected to `/`
- Authenticated users can access `/dashboard`, `/inventory`, and `/addmedicine`
- Expired sessions force a safe logout flow
- Route guards do not depend on stale `localStorage` values

### Story 4
**As a logged-in user, I want my profile information available across the app so that the header, sidebar, and API calls can use the same source of truth.**

Acceptance criteria:
- The header can read the current user from the auth store
- The sidebar can show identity-dependent UI without extra fetches
- Inventory/API calls can attach auth credentials consistently
- User profile data updates centrally after login or session refresh
- Missing profile fields degrade gracefully

### Story 5
**As a user who signs out, I want my session removed immediately so that the app does not keep me authenticated accidentally.**

Acceptance criteria:
- Logout clears auth state from memory
- Any persisted non-sensitive cache is cleared or invalidated
- Protected routes redirect to `/`
- The next app load starts unauthenticated unless a valid session still exists server-side
- Logout handles repeated clicks without breaking navigation

## 3. Architecture & Component Design

### Proposed component hierarchy
- `App`
  - `AuthProvider`
    - `AuthBootstrapper`
    - `ProtectedRoute`
    - `AppLayout`
      - `Header`
      - `Sidebar`
      - `Outlet`
  - `LoginPage`
  - `Dashboard`
  - `Inventory`
  - `AddMedicine`

### Smart vs presentational split
- **Smart/container**
  - `AuthProvider`
  - `AuthBootstrapper`
  - `ProtectedRoute`
  - `LoginPage`
- **Presentational**
  - `Header`
  - `Sidebar`
  - existing dashboard/inventory UI blocks

### Auth store responsibilities
- hold `user`, `status`, `error`, and `initialized`
- expose `login()`, `logout()`, `refreshSession()`, and `clearAuthError()`
- own boot-time session hydration
- provide a single source of truth for route guards and UI chrome

### Hook definitions
- `useAuth()`
  - returns auth state and actions
- `useAuthBootstrap()`
  - runs the initial session/profile check
- `useSessionQuery()` or equivalent
  - handles cached server session/profile fetch logic if React Query is introduced

### Suggested props/state
- `ProtectedRoute`
  - no props; reads auth state and `initialized`
- `AuthBootstrapper`
  - no props; runs once at app start
- `LoginPage`
  - local form state, validation, submission loading, field errors
- `Header`
  - reads `user` only; no auth logic

## 4. Data Flow & State Management

### State model
**Local state**
- form inputs
- OTP/register steps
- page-specific sorting, filters, pagination
- modal visibility

**Global auth state**
- authenticated user profile
- auth initialization flag
- auth error state
- login/logout actions

### Recommended auth strategy
Preferred:
- backend sets refresh/session credential in `HttpOnly Secure SameSite` cookie
- frontend fetches current user from `/user/profile` or `/auth/me`
- access token is either short-lived and kept in memory or derived server-side

Transitional option if backend changes are incremental:
- keep only non-sensitive user profile in React state
- avoid storing JWT in `localStorage`
- if persistence is unavoidable during migration, use a short-lived, non-sensitive session flag only

### API endpoints
Current endpoints already in use:
- `POST /user/login`
- `POST /user/register`
- `POST /user/send-otp`
- `POST /user/verify-otp`
- `GET /user/profile`

Recommended auth bootstrap flow:
1. app starts
2. client calls `GET /user/profile`
3. backend returns the current user if session is valid
4. client stores the returned profile in auth state

Expected response shape:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "alex",
    "email": "alex@pharmacy.com",
    "role": "pharmacist",
    "first_name": "Alex",
    "last_name": "Carter",
    "phone_number": null,
    "license_number": null,
    "status": "active"
  }
}
```

### Error handling and loading states
- bootstrapping state shows a full-page skeleton/spinner
- unauthorized response clears auth and redirects to `/`
- network timeout or offline states show a retry action
- profile fetch failures should not crash the app shell
- login/register errors stay inline on the form

## 5. User Experience & Interaction Flow

### User journey
1. User opens the app
2. App checks session/profile status in the background
3. If authenticated, app lands on the protected route with the shell visible
4. If not authenticated, app shows the login screen
5. After login, app stores the user profile in global state and navigates to the dashboard
6. On logout, the app clears state and returns to the public entry screen

### UX requirements
- no visible “login flash” during boot
- responsive layout for mobile, tablet, and desktop
- clear loading feedback for session bootstrap and login submit
- accessible form controls with labels, helper text, and error messages
- keyboard navigable login and logout actions
- route guards should be screen-reader friendly and avoid focus traps

### Accessibility
- use semantic buttons and inputs
- ensure all form fields have visible labels
- surface auth errors with text, not color alone
- keep focus on the first invalid field after submission
- preserve tab order in modal and navigation flows

## 6. Implementation Strategy & Task Breakdown

### Sequential checklist
1. Define the new auth state shape and bootstrap flags
2. Refactor `AuthProvider` to own in-memory auth state instead of `localStorage` as source of truth
3. Add a boot-time session/profile fetch
4. Update `ProtectedRoute` to wait for auth initialization
5. Update `LoginPage` to write only to the auth store, not persistent storage
6. Update `Header`/`Sidebar` consumers to read from the auth store
7. Remove stale `localStorage` dependency paths or keep only a temporary migration bridge
8. Add unauthorized-response handling across the API layer
9. Validate route protection, refresh behavior, and logout flow
10. Document the backend contract for cookie/session support if required

### Edge cases
- backend unavailable on first load
- expired session after app boot
- partially migrated users with old `localStorage` auth data
- malformed stored auth payloads
- concurrent logout and in-flight requests
- multiple tabs signing out independently
- empty or missing user profile fields
- OTP/login errors during registration flow

### Recommendation
The best-practice target is: **do not persist JWTs in `localStorage`; use server-managed session/refresh cookies plus a client-side auth store for the current user profile**. If backend changes must happen in phases, migrate the client state first, then replace token persistence with cookie-based session auth.
