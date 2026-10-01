# Grand Line Atlas — Handoff

Where the project stands and what to know before picking it up. Last updated 2026-10-01, at the end of Phase 2.

---

## Status

| | |
|---|---|
| Phase | **Phase 2 (data pipeline) is done** and waiting for the owner to review the arc list and TODO-REVIEW items (PLAN.md requires this stop). Next is Phase 3 (island placement). |
| Data | Through episode 1180, as of 2026-10-01: 51 arcs, 42 places, 10 crew. `npm run data:fetch -- --refresh && npm run data:build` updates it. |
| Repo | https://github.com/Zander-M75/grand-line-atlas (public), branch `main` |
| Hosting | None yet (Vercel in Phase 9). |

## Read first

1. [PLAN.md](PLAN.md): scope, phases, hard constraints (§2), working agreements (§9).
2. [README.md](README.md): how to run things, stack, credits.
3. [src/config.ts](src/config.ts): map dimensions, zone layout, timings. The layout comment there explains how the flat map represents the world.
4. [scripts/sources/journey.ts](scripts/sources/journey.ts): the curated arc list (which arcs, which places each visits) that the data build checks against the wiki. The header comments in `scripts/build-arcs.ts` and `scripts/build-locations.ts` record what the wiki pages actually look like.
5. [data/generated/review/](data/generated/review/): the open TODO-REVIEW items from the last data build.

## Working rules (from PLAN.md §9)

- One phase at a time. Stop at the end of each phase and summarize for the owner.
- No official artwork of any kind, and no character drawings. Everything visual is original SVG/CSS.
- When wiki data is ambiguous, add it to the review list instead of guessing.
- Commit at logical checkpoints. Keep the README current.
- Push to GitHub at the end of every phase (owner's standing instruction, 2026-10-01).

## Where things diverge from PLAN.md

| Plan says | We did | Why |
|---|---|---|
| React 18 | React 19 | react-leaflet 5 (current) requires React 19. React 18 would mean pinning react-leaflet 4. |
| Scaffold with `npm create vite` in place | Scaffolded in a temp folder and copied in | The folder already held PLAN.md. Dropped the template's demo assets and README. |
| ESLint | ESLint, replacing the template's oxlint | Current create-vite ships oxlint; the plan asks for ESLint + Prettier. |
| `Location` type as written | Added optional `animeOnly` | §5 asks for anime-only islands to be marked in data, but the interface had no field for it. |
| Episode ranges from arc and episode pages | From the wiki's per-saga `Episode Guide/*` pages, cross-checked against each arc's episode category | Arc pages compute their ranges in a template (`episode = auto`), so their wikitext has no numbers. The guides list every episode with its arc and air date. |
| Seed arc list and sagas (§5) | Sagas follow the wiki's episode guide; added Uta's Past and Elbaph | §5 says to verify against the wiki. The wiki splits "Four Emperors Saga" into Whole Cake Island and Wano Country sagas and assigns every filler arc to a saga. Differences are on the review list. |
| Hand-write `data/generated/crew.json` | Written in `scripts/sources/crew.ts`, emitted by `build-crew` | JSON can't hold the comments §5 asks for on ambiguous joins. The build also re-checks each join against the wiki. |
| Cache to `data/raw/<sanitized-title>.json` | `data/raw/{pages,categories,categories-of}/<title>.<hash>.json` | The hash suffix guards against macOS's case-insensitive file names. |
| Hand-coded `public/map/world.svg` loaded with `ImageOverlay` | Inline SVG drawn by `src/map/BaseMap.tsx`, mounted with react-leaflet's `SVGOverlay` | A static file would duplicate every zone boundary in `config.ts`, so a config change wouldn't move the art (§6 wants config-only layout tweaks). An SVG loaded as an image also can't use the app's web fonts, so labels would fall back to a system serif. Still original, hand-written SVG; it just lives in a component. |

Smaller choices:

- **Coordinates:** map pixels use the SVG's own space (origin top-left, y down). `toLatLng` (Phase 1) will flip y for Leaflet. Every number in `config.ts` is in this space.
- **TypeScript 6.0:** typescript-eslint supports TS < 6.1, so don't bump TS past 6.0 until it catches up.
- **Shared files:** `src/config.ts` and `src/types.ts` are imported by Node (vite.config.ts and the data scripts), so their imports use explicit `.ts` extensions and they can't touch browser or Vite-only APIs.
- **Fonts:** IM Fell English (titles, map lettering) and Atkinson Hyperlegible Next (UI and reading text), self-hosted through Fontsource.
- **Region labels** are title-case italic, not capitals: IM Fell's italic capital U looks like a V ("BLVE").
- **Zoom:** max zoom is 1 (2× map pixels). The min zoom is computed by `FitWorldZoom` to fit the whole map for the current screen.
- **Placeholders:** components return `null` and `data:layout` exits 1 with "not implemented", so nothing pretends to work before its phase.
- **Arc data:** names keep the wiki's "Arc" suffix ("Enies Lobby Arc"), so they never collide with place names. `meta.json` records the latest aired episode and the as-of date (`build-arcs --as-of=YYYY-MM-DD` pretends a different date). Locations sit at (0, 0) until Phase 3's auto-layout.
- **Arcs with no map stop:** 8 anime-only arcs name no island. Phase 4 must handle an arc with empty `locationIds` (the ship stays where it was).

## Owner decisions

Settled:

- **World layout** (2026-10-01): the default in `config.ts` stands. Red Line down the middle at Mary Geoise, Reverse Mountain on the far-west edge, Paradise west, New World east, East Blue north-west.
- **Wiki User-Agent contact** (2026-10-01): use the repo URL, not an email.

Open, from the Phase 2 review list ([data/generated/review/arcs.json](data/generated/review/arcs.json)):

1. **Buggy Side Story and Koby and Helmeppo** adapt manga cover stories, so the wiki doesn't call them filler. They're kept as anime-only, off-route arcs, per PLAN.md's [F] marks.
2. **Two arcs added** that PLAN.md doesn't list: Uta's Past (anime-only flashback inside Wano) and Elbaph (after Egghead, airing now).
3. **Sagas** follow the wiki's episode guide, which differs from PLAN.md for 15 arcs (mostly filler the plan left between sagas, plus the Four Emperors split).
4. **Eight arcs with no map stop**, because the wiki names no island: Koby and Helmeppo, Post-Arabasta, Ocean's Dream, Foxy's Return, Z's Ambition, Caesar Retrieval, Marine Rookie, Cidre Guild.
5. **Place choices:** Romance Dawn starts at Foosha Village; Syrup Village includes the Island of Rare Animals; Reverse Mountain includes Twin Cape; Post-War is shown at Rusukaina; Thriller Bark is placed in Paradise (the wiki files it under West Blue, where the ship came from).
6. **Crew joins with two readings:** Nami officially joins in episode 44 (she navigates from episode 9), Jinbe in episode 980 (invited in 568, pledged in Whole Cake Island).

## Open items

- The title cartouche floats over the map's north-west corner, which at full-map zoom covers part of East Blue. Revisit when the ArcCard (also top-left) lands in Phase 5; the title may move into the timeline strip.
- On a phone the whole-world view is a thin strip with empty sea above and below. Phase 4's camera will open on the current arc instead.
- Leaflet's own zoom animation doesn't check reduced motion yet (Phase 6 wires up `useReducedMotion`).
- The bottom timeline strip is empty until Phase 4.
- No favicon yet (Phase 9).
- Usopp leaves the crew during Water 7 and rejoins in episode 323; the crew data keeps him aboard throughout.
