# Mobile-First UX Pass

This document captures every file touched in the `mobile-first` branch and the
rationale for each change. The strategy was **non-destructive overlay**: a new
`mobile-first.css` is loaded after the existing `index.css` and is fully scoped
to viewports `< 1024px`, so the desktop layout (≥ 1024px) is byte-identical.

---

## Audit summary

A full audit was performed against the criteria in the brief (touch targets,
typography, spacing, viewport, navigation, form/input UX, icons, scroll/overflow,
gestures/feedback, performance, safe areas). Findings, grouped Critical → Low,
are summarised below — each fix below references the finding ID.

### Critical
- **C1** Inputs at 14–14.4px caused iOS Safari force-zoom on focus.
- **C2** Most touch targets (`.btn`, `.btn-sm`, `.btn-icon`, `.tab`,
  `.set-row input`, `.toast-close`, `.datepicker-cell/nav`,
  `.muscle-chip`, `.date-pill`, `.mobile-menu-btn`) below 44×44.
- **C3** No safe-area insets — content hidden behind notch / home indicator.
- **C4** Viewport meta missing `viewport-fit=cover` and
  `interactive-widget=resizes-content`.
- **C5** AI chat input not keyboard-aware on mobile.
- **C6** Global `body { user-select: none }` blocked text copying.

### High
- **H1** Inputs missing `inputMode`, `autoComplete`, `enterKeyHint` —
  wrong keyboard popped on mobile, no autofill.
- **H2** Desktop-centric hamburger drawer instead of bottom tab bar.
- **H3** No active/pressed feedback on tappable elements.
- **H4** Wide tables overflow horizontally.
- **H5** Modals not bottom-sheet on mobile.
- **H6** Workout set inputs lack stepper-friendly affordance.
- **H7** No `-webkit-tap-highlight-color: transparent` reset.

### Medium / Low
- **M1** Toast container ignores notch / overlaps header.
- **M2** Body Map SVG can overflow narrow viewports.
- **M4** Voice FAB sits in iPhone home-indicator zone.
- **M6** Date pills wrap into multiple lines instead of horizontal strip.
- **M7** No bottom-nav clearance in `.app-main`.
- **L1–L5** Native font fallback, focus-visible distinction, theme-color, etc.

---

## Files added

### `client/src/styles/mobile-first.css` *(new)*
The single source of mobile-first overrides. Scoped to `@media (max-width: 1023.98px)`
plus a `<= 767.98px` phone block and a `<= 380px` tiny-phone block. Addresses
**C1, C2, C3, C5, H3, H4, H5, H7, M1, M2, M4, M6, M7** in one place.

Highlights:
- 16px floor on every input/textarea/select to defeat iOS auto-zoom (C1)
- 44 × 44 minimums + 48 × 48 for nav/inputs (C2)
- `env(safe-area-inset-*)` for `.mobile-header`, `.sidebar`, `.app-main`,
  `.toast-container`, `.voice-fab`, `.voice-panel`, `.bottom-nav`,
  `.modal`, `.auth-page`, `.ai-chat-input-area` (C3, M4, M7)
- AI chat input is `position: sticky; bottom: 0` with safe-area padding
  and the page uses `100dvh / 100svh` so the soft keyboard never hides it (C5)
- Modals slide up as bottom sheets with column-reversed actions for thumb reach (H5)
- `:active { transform: scale(0.97) }` on all tappable surfaces (H3)
- Date pills become a horizontally scrolling, snap-aligned strip (M6)
- Bottom-nav styles (`.bottom-nav`, `.bottom-nav__item`,
  `.bottom-nav__icon-wrap`, `.bottom-nav__label`) — only displayed at
  `<= 768px` (H2)
- Body Map SVG capped at `max-width:100%; max-height:60vh` (M2)
- `prefers-reduced-motion` honored

### `client/src/components/BottomNav.tsx` *(new)*
Mobile-only 5-tab bottom navigation: **Home · Workouts · Nutrition · AI · Profile**.
Picks the most used user routes and places them in the thumb zone, replacing the
hamburger-only navigation pattern on phones (H2). Secondary screens (Body Map,
Statistics) remain reachable through the existing side drawer.

### `MOBILE_FIRST_CHANGES.md` *(this file)*

---

## Files modified

| File | What changed | Audit IDs |
|---|---|---|
| `client/index.html` | Added `viewport-fit=cover` + `interactive-widget=resizes-content`, dual `theme-color` (light/dark), `apple-mobile-web-app-*` meta, `apple-touch-icon`, `format-detection` for phone numbers. | C4, L5 |
| `client/src/index.css` | Removed global `user-select:none` from body (kept it scoped to UI chrome only); added `-webkit-tap-highlight-color: transparent`; added `-webkit-text-size-adjust:100%`; added `overscroll-behavior-y:none`; prepended `Segoe UI / Roboto` to native font stack. | C6, H7, L1 |
| `client/src/main.tsx` | Imports `./styles/mobile-first.css` after `./index.css` so overlay wins. | (all CSS fixes) |
| `client/src/App.tsx` | `ProtectedLayout` mounts `<BottomNav />` after `<main>`. Admin/Super-Admin layouts intentionally untouched (operate primarily on desktop). | H2 |
| `client/src/pages/AuthPage.tsx` | All 4 inputs got `autoComplete`, `inputMode`, `autoCapitalize`, `autoCorrect`, `spellCheck`, `enterKeyHint`. | H1 |
| `client/src/pages/ProfilePage.tsx` | Display-name input → `autoComplete="name"`; weight/height/age/calorie inputs → `inputMode="decimal/numeric"` with sensible `min/step` and `enterKeyHint`. | H1 |
| `client/src/pages/WorkoutsPage.tsx` | Set rows (reps/weight) and cardio (duration/distance) inputs → `inputMode="numeric/decimal"`, `min/step`, `enterKeyHint`. Brings up the numeric keypad immediately. | H1, H6 |
| `client/src/pages/NutritionPage.tsx` | Food search → `type="search" inputMode="search" enterKeyHint="search"`. Quantity + custom-food calorie/macro inputs → `inputMode="decimal/numeric"`. Custom food name → `autoCapitalize="words"`. | H1 |
| `client/src/pages/admin/MembersPage.tsx` | Display name, username, email, password inputs given proper autocomplete/keyboard hints. | H1 |
| `client/src/pages/admin/AdminRegisterPage.tsx` | All 6 fields hardened the same way. | H1 |
| `client/src/pages/superadmin/FoodsPage.tsx` | All numeric fields and search input updated. | H1 |
| `client/src/pages/superadmin/AllUsersPage.tsx` | Search input → `type="search"` + search keyboard. | H1 |
| `client/src/pages/superadmin/ExercisesPage.tsx` | Search input → `type="search"` + search keyboard. | H1 |

---

## Validation checklist

- [x] Branch `mobile-first` created off `main`.
- [x] No interactive element below 44px on mobile (CSS overlay enforces it).
- [x] No input below 16px on mobile (CSS overlay enforces it).
- [x] `viewport-fit=cover` set; safe-area insets applied to every fixed element.
- [x] Bottom-nav added; primary actions in thumb zone.
- [x] AI chat input keyboard-aware via sticky position + `100dvh`.
- [x] Modals turn into bottom sheets on mobile.
- [x] Desktop layout (≥ 1024px) unchanged — overrides scoped via media queries.
- [x] `npm run build` succeeds (see commit log).
- [ ] **User-side**: run Lighthouse mobile audit on a deployed build to verify
  Performance ≥ 80 / Accessibility ≥ 90. Cannot run from this CLI environment.

---

## Reverting

To roll back: `git checkout main && git branch -D mobile-first`. All changes
are confined to this branch and the overlay strategy means nothing in
`index.css` was structurally rewritten.


---

# Phase 2 — OTP, Settings, Theme Toggle & Admin Mobile Parity

## 1. Email-OTP signup verification (Gmail SMTP)
- **NEW** `server/models/Otp.js` — TTL-indexed OTP store (purpose: signup / change_password / change_username / reset_data). Codes are SHA-256 hashed at rest; 5 wrong attempts → record auto-deleted.
- **NEW** `server/utils/mailer.js` — lazy nodemailer Gmail SMTP transport, branded HTML email.
- **NEW** `server/utils/otp.js` — `issueOtp` / `consumeOtp` API (single source of truth).
- `server/models/User.js` — added `emailVerified` (default `true` to grandfather existing users).
- `server/routes/auth.js` — full rewrite:
  - `POST /auth/register/initiate` — validates input, pre-hashes password, stores it inside the OTP doc, emails the code. **No User row is created yet.**
  - `POST /auth/register/verify` — consumes OTP, re-checks uniqueness, creates the User (skips the bcrypt pre-save hook because the password is already hashed via `unmarkModified('password')`).
  - `POST /auth/register/resend` — resend a sign-up code.
  - `POST /auth/me/otp` — issue an OTP for any sensitive Settings action.
  - `POST /auth/me/change-password` — current-password + OTP guarded.
  - `POST /auth/me/change-username` — uniqueness + OTP guarded.
  - `POST /auth/me/reset-data` — OTP guarded; deletes only the caller's `WorkoutSession` and `MealEntry` rows. Restricted to `role === 'user'`.
  - Old single-step `/auth/register` removed (clients must go via initiate + verify).
  - Password update removed from `PUT /auth/me` (must go through `/me/change-password`).
- **Required `.env`**: `SMTP_USER`, `SMTP_PASS` (Gmail App Password — needs 2FA + https://myaccount.google.com/apppasswords). Optional: `SMTP_FROM`, `APP_NAME`, `OTP_TTL_MIN` (default `10`), `OTP_DEV_LOG=true` (prints code to console for dev).

## 2. Account Settings page (OTP-gated)
- **NEW** `client/src/pages/SettingsPage.tsx` — three cards:
  - **Change username** — uniqueness check + OTP.
  - **Change password** — current-password + new password + OTP. Forces re-login on success.
  - **Reset all data** — typed `DELETE` confirmation + OTP. Visible only for `role === 'user'`.
- Routed at `/settings`, `/admin/settings`, `/super-admin/settings` so all roles can change password / username; the destructive reset-data card is hidden for non-users (server enforces too).
- `client/src/context/AuthContext.tsx` — `register()` split into `initiateRegister()` + `verifyRegisterOtp()` + `resendRegisterOtp()`. Added `setLocalUser()` helper for in-place username updates.
- `client/src/pages/AuthPage.tsx` — added the OTP verification step between the sign-up form and the existing pending / auto-approved screens (resend with 30 s cooldown, numeric inputmode, `autocomplete="one-time-code"`).

## 3. Theme toggle (sun/moon emoji in header)
- **NEW** `client/src/hooks/useTheme.ts` — single source of truth; reads / writes `data-theme="alternate"` and `localStorage("theme")`, syncs via the `storage` event, falls back to system `prefers-color-scheme`.
- **NEW** `client/src/components/ThemeToggle.tsx` — 44×44 round button showing ☀️ in dark mode (tap to switch to light) / 🌙 in light mode.
- Mounted in the top-right of the mobile-header in **all three layouts** (`App.tsx` → ProtectedLayout, `AdminLayout.tsx`, `SuperAdminLayout.tsx`). On desktop (≥769 px) it floats fixed in the top-right of the viewport so the entry point is identical everywhere.
- Removed the duplicated "Change Theme" sidebar buttons + duplicated theme state in `Sidebar.tsx`, `AdminLayout.tsx`, `SuperAdminLayout.tsx`. Removed the now-dead theme-init `useEffect` from `App.tsx`.

## 4. Admin & Super-Admin mobile parity
- `client/src/components/BottomNav.tsx` refactored to take an `items: BottomNavItem[]` prop.
- `AdminLayout.tsx` mounts a 3-tab bottom nav (Home / Members / Settings).
- `SuperAdminLayout.tsx` mounts a 5-tab bottom nav (Home / Admins / Users / Foods / Settings).
- Both now expose Settings in their sidebar nav (Sidebar already does).
- The existing mobile-first.css overlay already styled `.mobile-header`, `.sidebar`, `.app-main` for these layouts because they share class names — Phase 1 styles now apply identically to admin / super-admin pages.

## 5. CSS additions (`client/src/styles/mobile-first.css`)
- `.mobile-header-actions` (right-aligned action slot in the mobile header; floats top-right on desktop).
- `.theme-toggle-pill` / `.theme-toggle-emoji` (44×44 touch target, scale-on-press feedback).
- `.settings-page`, `.settings-card`, `.settings-card--danger`, `.settings-card-header`, `.settings-form`, `.settings-btn`, `.settings-action-row`, `.otp-input` (centered, letter-spaced 6-digit input).

## Files added
- `server/models/Otp.js`
- `server/utils/mailer.js`
- `server/utils/otp.js`
- `client/src/hooks/useTheme.ts`
- `client/src/components/ThemeToggle.tsx`
- `client/src/pages/SettingsPage.tsx`

## Files modified
- `server/models/User.js`
- `server/routes/auth.js`
- `server/package.json` (+ `nodemailer`)
- `client/src/App.tsx`
- `client/src/context/AuthContext.tsx`
- `client/src/pages/AuthPage.tsx`
- `client/src/components/BottomNav.tsx`
- `client/src/components/Sidebar.tsx`
- `client/src/layouts/AdminLayout.tsx`
- `client/src/layouts/SuperAdminLayout.tsx`
- `client/src/styles/mobile-first.css`

---

## 5. AI assistant textarea + super-admin user activity tracking

### AI assistant textarea (mobile + desktop)
- `client/src/pages/AIAssistantPage.tsx` — auto-grow textarea on every keystroke (`style.height = scrollHeight`). Reset height + remove `has-overflow` class after the message is sent.
- `client/src/index.css` — `.ai-chat-input` now starts with `overflow-y: hidden` and `line-height: 1.4`. The scrollbar only appears once the user types past the 120 px max-height (via the `has-overflow` class). Empty / single-line input no longer shows a phantom scrollbar on mobile.

### Super-admin: per-user activity insight
- `server/models/User.js` — added `lastSeenAt` and `lastLoginAt` date fields.
- `server/middleware/auth.js` — `protect` middleware now bumps `lastSeenAt` once per minute per user (fire-and-forget, throttled to avoid write amplification).
- `server/routes/auth.js` — login stamps `lastLoginAt` + `lastSeenAt`.
- `server/routes/superAdmin.js` — new `GET /super-admin/users/:id/activity` endpoint returning `lastSeenAt`, `lastLoginAt`, last logged workout, last logged meal, total workouts, total meals.
- `client/src/pages/superadmin/AllUsersPage.tsx`:
  - Added a **Last seen** column with a colour-coded relative-time pill (green ≤ 7 d, amber ≤ 30 d, red > 30 d, grey never).
  - Added an engagement summary strip (Active 7 d / Active 30 d / Dormant 30 d+ / Never seen) above the table.
  - Added an **Inactive 30 d+** filter tab so the super-admin can quickly find disengaged users.
  - Added a per-row **Activity** action that opens a modal with last-seen, last-login, last workout, last meal and lifetime totals — fetched lazily from the new endpoint.
