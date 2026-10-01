# Grand Line Atlas — Handoff

Where the project stands and what to know before picking it up. Last updated 2026-10-01, at the end of Phase 0.

---

## Status

| | |
|---|---|
| Phase | **Phase 0 (project setup) is done** and waiting for owner review. Next is Phase 1 (base map + map shell). |
| Repo | https://github.com/Zander-M75/grand-line-atlas (public), branch `main` |
| Hosting | None yet (Vercel in Phase 9). |

## Read first

1. [PLAN.md](PLAN.md): scope, phases, hard constraints (§2), working agreements (§9).
2. [README.md](README.md): how to run things, stack, credits.
3. [src/config.ts](src/config.ts): map dimensions, zone layout, timings. The layout comment there explains how the flat map represents the world.

## Working rules (from PLAN.md §9)

- One phase at a time. Stop at the end of each phase and summarize for the owner.
- No official artwork of any kind, and no character drawings. Everything visual is original SVG/CSS.
- When wiki data is ambiguous, add it to the review list instead of guessing.
- Commit at logical checkpoints. Keep the README current.

## Where things diverge from PLAN.md

| Plan says | We did | Why |
|---|---|---|
| React 18 | React 19 | react-leaflet 5 (current) requires React 19. React 18 would mean pinning react-leaflet 4. |
| Scaffold with `npm create vite` in place | Scaffolded in a temp folder and copied in | The folder already held PLAN.md. Dropped the template's demo assets and README. |
| ESLint | ESLint, replacing the template's oxlint | Current create-vite ships oxlint; the plan asks for ESLint + Prettier. |
| `Location` type as written | Added optional `animeOnly` | §5 asks for anime-only islands to be marked in data, but the interface had no field for it. |

Smaller choices:

- **Coordinates:** map pixels use the SVG's own space (origin top-left, y down). `toLatLng` (Phase 1) will flip y for Leaflet. Every number in `config.ts` is in this space.
- **TypeScript 6.0:** typescript-eslint supports TS < 6.1, so don't bump TS past 6.0 until it catches up.
- **Shared files:** `src/config.ts` and `src/types.ts` are imported by Node (vite.config.ts and the data scripts), so their imports use explicit `.ts` extensions and they can't touch browser or Vite-only APIs.
- **Fonts:** IM Fell English (titles, map lettering) and Atkinson Hyperlegible Next (UI and reading text), self-hosted through Fontsource.
- **Placeholders:** components return `null` and data scripts exit 1 with "not implemented", so nothing pretends to work before its phase.

## Owner decisions needed

1. **World layout (needed before Phase 1 draws the map).** Current default in `config.ts`: the Red Line runs down the middle at Mary Geoise, Reverse Mountain sits on the far-west edge (the Red Line wraps around the cylinder), Paradise fills the west half of the Grand Line, the New World the east half, and East Blue is the north-west quadrant so the voyage reads left to right. Confirm, or name the reference map to match.
2. **Wiki User-Agent contact (Phase 2).** PLAN.md asks for a contact in the User-Agent. Which email or URL should go there? (The repo URL works if the owner prefers not to list an email.)

## Open items

- `public/map/world.svg` is a one-rectangle placeholder until Phase 1.
- No favicon yet (Phase 9).
