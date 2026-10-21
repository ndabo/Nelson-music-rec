# Nelson Fitness — Visual Rebrand Design

**Date:** 2026-10-21
**Status:** Approved (pending spec review)
**Scope:** Front-end visual re-theme only. No backend, API, or behavioral changes.

## Goal

Re-skin the song request app as **Nelson Fitness** — the Brown University recreation gym — with a warm, premium, Brown-*inspired* identity (not official Brown University branding). Replace the current generic green theme with a locked design system. Functionality (requesting, queue, limits, staff actions, PIN gate) stays exactly as-is.

## Design Direction (locked)

**Personality:** Warm Minimal — quiet cream/sand surfaces, brown text, a single confident red accent, generous whitespace. Feels boutique-wellness, not athletics-department.

**Staff portal visibility:** Members must never see or reach the staff portal from the member UI. The member top bar shows the wordmark only — no "Staff" link anywhere. `/staff` remains reachable only by typing the URL directly, then passing the existing PIN gate. (The current nav already omits a Staff link; this preserves and formalizes that.)

## Design Tokens

### Color
| Token | Value | Use |
|-------|-------|-----|
| `--bg` | `#FAF7F2` | App background (warm cream) |
| `--surface` | `#FFFFFF` | Cards, panels, inputs |
| `--surface-warm` | `#FBF4EA` | Hover / highlighted suggestion row |
| `--text` | `#4E3629` | Primary text (seal brown) |
| `--text-muted` | `#8A7D66` | Secondary copy |
| `--text-faint` | `#B3A896` | Metadata, placeholders, labels |
| `--border` | `#EAE2D6` | Card/input borders, dividers |
| `--accent` | `#C8102E` | Brown Red — buttons, active states, eyebrow, highlights |
| `--accent-wash` | `#FBEDEC` | Request-limit chip background |
| `--art-placeholder` | `#F1E9DC` | Album-art fallback |

**Accessibility:** Verify contrast during implementation. Primary text (`#4E3629` on `#FAF7F2`) is very high contrast. Red is used for accents, the eyebrow, and white-on-red buttons — confirm white-on-`#C8102E` meets WCAG AA (≥4.5:1 for the button label); if it falls short, darken the button background to `#B50015` while keeping `#C8102E` for larger/decorative accents. Don't use small red text on the cream background below AA.

### Typography
- **Headlines / display:** Fraunces (serif), weight 600. Used for `h1`, section titles, the big queue count, and the wordmark.
- **Body / UI:** Inter, weights 400–700. Everything else (labels, buttons, copy, metadata).
- **Loading:** Add Google Fonts `<link>` tags for Fraunces + Inter to `frontend/index.html` (preconnect + stylesheet). Keep existing system fallbacks.

### Shape & depth
- Radius: 12px cards/inputs/buttons, 999px for chips, 7–8px for album art and small action buttons.
- Shadow: soft, warm, used sparingly — e.g. `0 18px 50px -24px rgba(78,54,41,.45)` on primary panels only. Avoid heavy shadows everywhere (keeps the "quiet" feel).
- Spacing: generous — hero section breathes; card padding ~ clamp(16px, 4vw, 24px).

## Wordmark

`Nelson.` set in Fraunces, weight 700, with the period in `--accent` red. A small tracked `FITNESS` (Inter, 9px, letter-spacing 2px, `--text-faint`) sits beside/under it where space allows. Replaces the current Dumbbell + "Gym Song Requests" brand lockup.

## Component-by-component

All class names below already exist in `frontend/src/styles.css`; this is a re-theme of those rules, not new markup (except the wordmark and copy noted).

1. **Top bar (`.top-bar`, `.brand`, `.top-nav`)** — cream/translucent bar, bottom border `--border`. Brand becomes the `Nelson.` wordmark. On the member page: wordmark only, no nav links. Active-state underline uses red instead of the green pill.
2. **Member request page (`.request-layout`, `.request-copy`, `.eyebrow`, `h1`)** — eyebrow "Brown Recreation" in red; Fraunces `h1` (two-line hero "Ask us to play a song"); muted supporting copy.
3. **Request-limit indicator** — restyle as a pill chip (`--accent-wash` bg, red text) reading "N of 3 requests left today".
4. **Search (`.song-search`, `.search-input`, `.suggestions`)** — white input, red focus ring (replace green), red search glyph. Suggestion rows: warm hover (`--surface-warm`), album art or `--art-placeholder` fallback.
5. **Selected song (`.selected-song`)** — warm-bordered card.
6. **Buttons (`.primary-button`, `.secondary-button`, `.icon-button`)** — primary = white on red, 12px radius; secondary = white with warm border, brown text. Recolor disabled/hover states to the warm/red system.
7. **Staff dashboard (`.staff-layout`, `.section-header`, `.queue-summary`, `.queue-item`, `.queue-actions`)** — eyebrow "Staff Dashboard"; Fraunces "Pending queue" title; queue count rendered large in Fraunces red. Queue cards: album art + title/artist + relative time; Complete = red ✓ solid button, Reject = outline ✕. Updating row dims (existing `isUpdating`).
8. **PIN lock (`.staff-lock-panel`, `.lock-icon`, `.pin-input`)** — same warm card system; lock icon chip in accent-wash/red; red focus ring on the PIN input.
9. **States (`.empty-state`, `.helper-text`, `.error-text`, `.success-text`)** — empty state in warm card; success text in brown/red; error stays an accessible red distinct from brand red if needed.
10. **Responsive** — keep existing breakpoints/behavior at `max-width: 760px`; only colors/type/spacing change.

## Copy changes
- Brand/wordmark: "Gym Song Requests" → `Nelson.` / "Nelson Fitness".
- Eyebrow on request page → "Brown Recreation".
- `RequestPage.tsx` already has an in-progress tweak ("Nelson Fitness center playlist"); reconcile to the final wording during implementation.
- `<title>` / document head and any "Fitness center" strings reviewed for consistent "Nelson Fitness" naming.

## Files affected
- `frontend/src/styles.css` — primary work: token-ize `:root`, recolor/retype all rules above.
- `frontend/src/App.tsx` — wordmark lockup; confirm member bar has no Staff link.
- `frontend/index.html` — Google Fonts links; `<title>` update.
- `frontend/src/pages/RequestPage.tsx` — eyebrow/copy, limit chip markup if needed.
- `frontend/src/pages/StaffDashboard.tsx` — section eyebrow/title copy, queue count styling hook if needed.
- `frontend/src/components/QueueItem.tsx`, `SongSearchBox.tsx` — class/markup tweaks only if the restyle needs them (prefer CSS-only).

## Non-goals
- No changes to API, database, request/queue logic, limits, PIN auth, or routing behavior.
- No new libraries beyond web-font loading.
- No layout re-architecture — same grids, same breakpoints.

## Verification
- Visual: run the frontend (`npm run dev`), compare member + staff screens against the approved mockup.
- Confirm no Staff link is reachable from the member UI; `/staff` still loads the PIN gate directly.
- `npx tsc --noEmit` passes; `npm run build` succeeds.
- Spot-check color contrast (text + button label) meets WCAG AA.
- Check mobile (≤760px) layout is intact.
