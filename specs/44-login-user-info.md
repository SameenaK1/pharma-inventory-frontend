# Spec 44: Populate Login User Info in Header

## Objective
Replace hardcoded profile values in `src/components/header.tsx` with the authenticated user's actual **name** and **role** after login.

## Scope
- **In scope:** `src/components/header.tsx` behavior and rendering of user identity information.
- **Out of scope:** Backend API changes, authentication flow redesign, route changes, layout refactor, sidebar/dashboard updates.

## Current Behavior
`header.tsx` currently renders static values in the profile area:
- Avatar text: `AD`
- Name: `Admin Depot`
- Role: `Super Admin`

This does not reflect the user who has actually logged in.

## Expected Behavior
After successful login and auth restoration:
1. Header shows the current logged-in user’s **display name**.
2. Header shows the current logged-in user’s **role**.
3. Avatar placeholder derives initials from the display name.
4. On logout, user info is cleared and no stale user details remain visible.

## Data Source
Use authenticated user state already managed by the app auth layer (current user/session payload restored from localStorage and maintained in auth context/hooks).

### Required user fields for header
- `name` (string): preferred display label in header.
- `role` (string): role subtitle beneath the name.

If auth storage uses a different shape, map it in the auth layer consumption within header (without introducing separate fetch logic in header).

## UI/UX Requirements
- Keep existing profile trigger/menu layout and interactions unchanged.
- Replace only hardcoded identity text and avatar letters with dynamic values.
- Role text remains visually secondary (dimmed/subtext style).
- Must not cause layout shift for typical name lengths.

## Fallback Rules
When complete user info is unavailable:
1. Name fallback: `username` (if present in auth payload).
2. Role fallback: `User`.
3. Avatar fallback initials:
   - derive from resolved display string;
   - if empty, show `U`.

These fallbacks are for safe rendering only and must not mask auth errors.

## Behavior on Auth State Changes
- **Login / session restore:** header updates to logged-in identity.
- **Logout:** header stops showing prior user details immediately after auth clear/redirect.
- **Unauthorized (401) flow:** consistent with existing app behavior that clears stored user and redirects to `/`.

## Non-Functional Constraints
- Keep all backend calls in service layer; do not add fetch calls inside header.
- Preserve existing Mantine-based structure and styling conventions.
- No changes outside this feature’s target surface.

## Acceptance Criteria
1. Given a logged-in user with `name="Aisha Khan"` and `role="Pharmacist"`, header shows:
   - Name: `Aisha Khan`
   - Role: `Pharmacist`
   - Avatar initials: `AK`
2. Given missing `name` but `username="aisha.k"`, header name shows `aisha.k`.
3. Given missing role, header role shows `User`.
4. After logout, previous user identity is not shown.
5. No regression in profile menu open/close behavior and logout action.

## Notes
This spec intentionally limits implementation to populating header identity from existing authenticated user state and avoids broader auth schema or UI redesign.
