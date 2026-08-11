# Feature Specification Document

## Feature Name
Move from Local Storage to Cookies for Authentication

## Feature Summary
Transition the app from storing JWTs in `localStorage` to using HTTP-only cookies for authentication. The frontend will stop persisting tokens directly and instead rely on cookie-backed session validation through the API.

## 1. Executive Summary & Scope

### Brief Summary
The current app stores `{ username, token }` in `localStorage` and reads it in `AuthProvider`, `ProtectedRoute`, and the API layer for authenticated requests. This feature replaces token storage with secure cookies so the browser never exposes the JWT to JavaScript, improving session security and reducing token leakage risk.

### In Scope
- Replace `localStorage` token persistence with cookie-based auth.
- Update frontend request handling to send credentials on authenticated API calls.
- Add session bootstrap logic to restore auth state from the server on app load.
- Update login, logout, profile fetch, and protected route behavior to work without client-readable tokens.
- Keep the existing login/register UX intact unless auth state requires a small loading transition.
- Ensure 401/session-expired flows redirect to the public entry screen.

### Out of Scope
- Rewriting the backend auth provider or user model.
- Changing the registration business rules, OTP flow, or role model.
- Introducing social login, MFA, or password reset.
- Redesigning the app shell, dashboard, or inventory screens.
- Implementing persistent client-side token storage of any kind.

## 2. Architecture & Component Design

### Proposed Component Hierarchy
- **`AuthProvider` (smart/container)**
  - Owns auth lifecycle, session bootstrap, login/logout actions, and auth status.
- **`ProtectedRoute` (smart/container)**
  - Guards authenticated routes based on session state.
- **`LoginPage` (hybrid)**
  - Presentational form with local step state for login/register flows.
  - Uses auth actions from context and API helpers for session-based login.
- **`AppLayout` (presentational shell)**
  - Remains the authenticated layout wrapper.
- **`AuthBootstrap` (new, optional smart component/hook)**
  - Performs one-time session validation when the app mounts.

### Key Component Responsibilities

#### `AuthProvider`
- **Props:** `children`
- **Internal state:**
  - `user: UserProfile | null`
  - `status: 'loading' | 'authenticated' | 'unauthenticated'`
  - `error: string | null`
- **Hooks:**
  - `useEffect` for initial session validation
  - `useReducer` or `useState` for auth state transitions
- **Responsibilities:**
  - Call session/profile endpoint on startup.
  - Expose `login()`, `logout()`, `refreshSession()`.
  - Never read or write JWTs in browser storage.

#### `ProtectedRoute`
- **Props:** none
- **Behavior:**
  - Render a loading state while auth is bootstrapping.
  - Redirect to `/` when session is unauthenticated.
  - Render `<Outlet />` when authenticated.

#### `LoginPage`
- **Props:** none
- **Internal state:**
  - Existing auth mode state (`login`, `register_email`, `register_otp`, `register_details`)
  - Form state for credentials and registration steps
  - Loading and error messaging
- **Hooks:**
  - `useAuth()`
  - `useNavigate()`
  - `useForm()`
- **Responsibilities:**
  - Submit login/register requests.
  - After successful login, trigger auth refresh instead of storing token.
  - Keep existing OTP-driven registration UX.

#### `AuthBootstrap` / `useAuthSession` (if extracted)
- **Props:** none
- **Responsibilities:**
  - Centralize initial `/user/profile` or `/user/session` request.
  - Prevent route flicker by holding the UI until auth state is resolved.

## 3. Data Flow & State Management

### Local State vs Global State

#### Global State
- Auth session state belongs in context:
  - authenticated user profile
  - auth status
  - session error
- Protected routing depends on global session state, not storage parsing.

#### Local State
- Form fields, validation, OTP countdown, and step transitions remain local to `LoginPage`.
- Component-specific loading states remain local to the form being submitted.
- Inventory/dashboard state is unchanged.

### Auth Data Flow

#### App Startup
1. App mounts.
2. `AuthProvider` sends a credentialed request to the server to validate the cookie session.
3. While pending, `ProtectedRoute` shows a loading state or blocks route rendering.
4. On success, auth context stores the returned user profile.
5. On 401/unauthorized, auth context marks the user unauthenticated and clears any cached session state.

#### Login Flow
1. User submits email/password.
2. Frontend calls login endpoint with `credentials: 'include'`.
3. Backend sets `Set-Cookie` with HTTP-only auth cookie.
4. Frontend does not read the token.
5. Frontend fetches the authenticated profile or uses the login response payload to populate auth state.
6. User is redirected to `/dashboard`.

#### Logout Flow
1. User clicks logout.
2. Frontend calls logout endpoint with credentials included.
3. Backend clears the cookie.
4. Auth context is reset locally.
5. User is redirected to `/`.

### API Endpoints to Consume

#### `POST /user/login`
**Request**
```json
{
  "email": "name@pharmacy.com",
  "password": "secret123"
}
```

**Expected Response**
```json
{
  "success": true,
  "user": {
    "username": "alexcarter99",
    "email": "name@pharmacy.com",
    "role": "pharmacist"
  }
}
```

**Server behavior**
- Set HTTP-only cookie containing the session/JWT.
- Cookie should be `Secure` in production, `SameSite=Lax` or `Strict` depending on deployment shape.

#### `POST /user/logout`
**Request**
```json
{}
```

**Expected Response**
```json
{
  "success": true
}
```

**Server behavior**
- Clear the auth cookie.

#### `GET /user/profile`
**Request**
- No body
- `credentials: 'include'`

**Expected Response**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "alexcarter99",
    "email": "name@pharmacy.com",
    "role": "pharmacist",
    "status": "active"
  }
}
```

#### Registration Endpoints
- `POST /user/send-otp`
- `POST /user/verify-otp`
- `POST /user/register`

These remain functionally the same unless the backend chooses to auto-create a session cookie after registration. If registration logs the user in, it must follow the same cookie/session rules as login.

### API Client Changes
- Add `credentials: 'include'` to all auth-dependent requests.
- Remove `localStorage` token lookup from `getAuthHeaders()`.
- Preserve `Content-Type: application/json` where applicable.
- On 401, clear auth state and redirect to `/`.

### Error Handling & Loading Strategy
- Use a dedicated `status` field for bootstrap state: `loading`, `authenticated`, `unauthenticated`.
- Show a lightweight loading overlay or centered spinner while session validation runs.
- Form errors remain inline on login/register screens.
- Network failures should show a friendly retryable message.
- 401 responses should be treated as session expiry, not as generic form validation errors.
- If profile fetch fails after a successful cookie login, retry once before forcing logout.

## 4. User Experience & Interaction Flow

### User Journey
1. User opens the app.
2. App validates cookie session silently.
3. If already authenticated, user lands directly on the protected area.
4. If not authenticated, user sees the existing login/register screen.
5. User logs in.
6. Browser receives HTTP-only cookie.
7. App fetches the current user profile and routes to `/dashboard`.
8. On logout or session expiry, user returns to the public screen.

### Visual / UX Requirements
- Keep the current Mantine-based layout and form styling.
- Add a subtle loading state during session bootstrap to avoid a flash of the login screen.
- Show clear feedback for:
  - invalid credentials
  - expired session
  - network failure
  - failed logout
- Maintain responsive behavior on mobile and desktop.
- Preserve keyboard accessibility:
  - tab order must follow form order
  - Enter submits active form
  - focus should move to the first invalid input on validation failure
- Add ARIA-friendly error messaging for async auth failures.

### Accessibility Considerations
- Use `aria-busy` on the auth container while session validation is in progress.
- Ensure inline errors are announced via accessible text patterns or live regions.
- Keep button labels descriptive and stateful during loading.
- Maintain sufficient color contrast for success/error messages.

## 5. Implementation Strategy & Task Breakdown

### Development Checklist
1. Update the API layer to support cookie-based auth requests with `credentials: 'include'`.
2. Remove all `localStorage` reads/writes related to auth tokens.
3. Redesign `AuthProvider` to bootstrap session state from `/user/profile`.
4. Add `status` tracking to distinguish loading, authenticated, and unauthenticated states.
5. Update `ProtectedRoute` to wait for auth bootstrap before redirecting.
6. Refactor `LoginPage` to call login/logout flows without storing tokens client-side.
7. Confirm logout clears the server cookie and resets frontend auth state.
8. Update 401 handling in the API layer so expired cookies route back to `/`.
9. Verify registration flow still works and does not break session bootstrap.
10. Test navigation refresh, direct deep-linking to protected routes, and logout from any protected page.

### Edge Cases to Consider
- **Initial page load with valid cookie:** app must restore session without redirecting to `/`.
- **Initial page load with expired cookie:** app should settle on the public screen, not loop redirects.
- **Network failure during bootstrap:** show a recoverable error state instead of a blank screen.
- **401 from any protected API call:** clear auth state immediately and redirect to login.
- **Cross-origin deployment:** backend must allow credentialed requests and proper CORS headers.
- **CSRF risk:** if frontend and backend are cross-site, cookie auth must be paired with SameSite and/or CSRF protection.
- **Multiple tabs:** logout in one tab should eventually invalidate other tabs when they next call the profile/session endpoint.
- **Registration auto-login vs manual login:** the frontend should support either backend behavior as long as the session cookie is present before redirecting to protected pages.
- **Cookie not sent in development:** verify domain, path, SameSite, and secure flags are compatible with local dev URLs.

### Success Criteria
- No auth token is stored in browser `localStorage`.
- Protected routes work after page refresh.
- Session restoration is driven by server validation, not client parsing.
- Login/logout behave consistently across navigation and refresh.
- Existing inventory and dashboard routes continue to work unchanged once authenticated.
