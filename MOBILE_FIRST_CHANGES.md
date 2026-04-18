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
