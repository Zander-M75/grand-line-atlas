# Grand Line Atlas — Handoff

Where the project stands and what to know before picking it up. Last updated 2026-10-01, at the end of Phase 1.

---

## Status

| | |
|---|---|
| Phase | **Phase 1 (base map + map shell) is done** and waiting for owner review. Next is Phase 2 (data pipeline). |
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
| Hand-coded `public/map/world.svg` loaded with `ImageOverlay` | Inline SVG drawn by `src/map/BaseMap.tsx`, mounted with react-leaflet's `SVGOverlay` | A static file would duplicate every zone boundary in `config.ts`, so a config change wouldn't move the art (§6 wants config-only layout tweaks). An SVG loaded as an image also can't use the app's web fonts, so labels would fall back to a system serif. Still original, hand-written SVG; it just lives in a component. |

Smaller choices:

- **Coordinates:** map pixels use the SVG's own space (origin top-left, y down). `toLatLng` (Phase 1) will flip y for Leaflet. Every number in `config.ts` is in this space.
- **TypeScript 6.0:** typescript-eslint supports TS < 6.1, so don't bump TS past 6.0 until it catches up.
- **Shared files:** `src/config.ts` and `src/types.ts` are imported by Node (vite.config.ts and the data scripts), so their imports use explicit `.ts` extensions and they can't touch browser or Vite-only APIs.
- **Fonts:** IM Fell English (titles, map lettering) and Atkinson Hyperlegible Next (UI and reading text), self-hosted through Fontsource.
- **Region labels** are title-case italic, not capitals: IM Fell's italic capital U looks like a V ("BLVE").
- **Zoom:** max zoom is 1 (2× map pixels). The min zoom is computed by `FitWorldZoom` to fit the whole map for the current screen.
- **Placeholders:** components return `null` and data scripts exit 1 with "not implemented", so nothing pretends to work before its phase.

## Owner decisions

Settled:

- **World layout** (2026-10-01): the default in `config.ts` stands. Red Line down the middle at Mary Geoise, Reverse Mountain on the far-west edge, Paradise west, New World east, East Blue north-west.
- **Wiki User-Agent contact** (2026-10-01): use the repo URL, not an email.

Open: none.

## Open items

- The title cartouche floats over the map's north-west corner, which at full-map zoom covers part of East Blue. Revisit when the ArcCard (also top-left) lands in Phase 5; the title may move into the timeline strip.
- On a phone the whole-world view is a thin strip with empty sea above and below. Phase 4's camera will open on the current arc instead.
- Leaflet's own zoom animation doesn't check reduced motion yet (Phase 6 wires up `useReducedMotion`).
- The bottom timeline strip is empty until Phase 4.
- No favicon yet (Phase 9).
