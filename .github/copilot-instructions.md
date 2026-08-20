# Copilot instructions for pharma-inventory-frontend

## Project shape

- This is a Vite + React 19 + TypeScript front end for a pharma inventory app.
- `src/main.tsx` mounts the app with `BrowserRouter`, `MantineProvider`, and `Notifications`.
- `src/App.tsx` owns routing:
  - `/` is the public login/register entry.
  - `/dashboard`, `/inventory`, and `/addmedicine` live under `ProtectedRoute` and the shared authenticated layout.
  - `AppLayout` renders the persistent sidebar, header, and page outlet.
- Authentication is session-like and client-side: the `AuthProvider` restores `user` from `localStorage`, and protected routes redirect to `/` when no token is present.
- The API layer is split by domain under `src/services/`: `apiClient.ts` (shared `API_BASE_URL`, headers, error/response helpers), `user.ts` (auth, OTP, login/register), `inventory.ts` (inventory CRUD, batch numbers), `medicine.ts` (medicine search), and `manufacturer.ts` (manufacturer search).

## Build, run, and validate

- Install dependencies: `npm install`
- Dev server: `npm run dev`
- Production build: `npm run build`
- Lint: `npm run lint`
- Preview build: `npm run preview`
- There is currently no dedicated test script or test runner configured in `package.json`, so there is no single-test command yet.

## High-level architecture

- `src/services/authcontext.tsx` owns auth state, login/logout helpers, and `localStorage` persistence.
- `src/services/ProtectedRoute.tsx` gates the authenticated area by checking the in-memory auth state first and then `localStorage` as a hydration fallback.
- `src/components/login.tsx` handles both login and multi-step registration (email OTP, then profile creation).
- `src/components/inventory.tsx` is the main data grid view: it fetches inventory from the API, supports search, sorting, pagination, delete, and modal-based add/edit flows.
- `src/components/addmedicine.tsx` is the inventory item form used from the inventory modal flow. It debounces medicine/manufacturer lookup calls and submits to the inventory API.
- `src/components/dashboard.tsx` is currently a mostly static summary dashboard with derived KPIs and warning tables.
- `src/components/sidebar.tsx` and `src/components/header.tsx` define the authenticated shell chrome.

## Key conventions

- Use Mantine components and the existing layout system unless there is a strong reason not to.
- Keep backend calls in the domain-specific `src/services/*.ts` modules; components should call the service layer instead of scattering `fetch` logic.
- Preserve the auth payload shape stored in `localStorage`: `{ username, token }`.
- Keep the `401` flow intact: clear the stored user and send the browser back to `/`.
- When adding authenticated screens, register them in `App.tsx` under `ProtectedRoute` and `AppLayout`, then add a matching sidebar link if needed.
- Reuse `src/utils/debounce.ts` for throttled search behavior.
- The inventory page mixes server-side filtering/pagination with client-side sorting for some sort modes; keep that split consistent when extending it.
- The Vite dev server sets `Cross-Origin-Opener-Policy: same-origin-allow-popups` in `vite.config.ts` to support OAuth popup behavior.
