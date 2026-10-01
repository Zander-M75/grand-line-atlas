# Grand Line Atlas — Handoff

Where the project stands and what to know before picking it up. Last updated 2026-10-01, at the end of Phase 3.

---

## Status

| | |
|---|---|
| Phase | **Phase 3 (island placement) is done** and waiting for the owner's placement review (PLAN.md requires this stop). Next is Phase 4 (timeline + route). |
| Data | Through episode 1180, as of 2026-10-01: 51 arcs, 42 places, 10 crew. `npm run data:fetch -- --refresh && npm run data:build` updates it. |
| Repo | https://github.com/Zander-M75/grand-line-atlas (public), branch `main` |
| Hosting | None yet (Vercel in Phase 9). |

## Read first

1. [PLAN.md](PLAN.md): scope, phases, hard constraints (§2), working agreements (§9).
2. [README.md](README.md): how to run things, stack, credits.
3. [src/config.ts](src/config.ts): map dimensions, zone layout, timings. The layout comment there explains how the flat map represents the world.
4. [scripts/sources/journey.ts](scripts/sources/journey.ts): the curated arc list (which arcs, which places each visits) that the data build checks against the wiki. The header comments in `scripts/build-arcs.ts` and `scripts/build-locations.ts` record what the wiki pages actually look like.
5. [data/generated/review/](data/generated/review/): the TODO-REVIEW items from the last data build (the Phase 2 ones are accepted; see Owner decisions).

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
| DevPositioner "Export" downloads or copies positions.json | **Save** writes `data/overrides/positions.json` directly (a dev-server-only endpoint, `scripts/lib/devPositionsPlugin.ts`), plus **Copy JSON** | Placing islands becomes drag, Save, commit. The endpoint exists only under `vite dev`, rejects cross-site requests, and validates the payload. |
| `data:layout` as its own step | Also chained into `data:build` (after build-locations) | build-locations writes placeholder positions, so the build output is only complete once layout runs. |
| Hand-coded `public/map/world.svg` loaded with `ImageOverlay` | Inline SVG drawn by `src/map/BaseMap.tsx`, mounted with react-leaflet's `SVGOverlay` | A static file would duplicate every zone boundary in `config.ts`, so a config change wouldn't move the art (§6 wants config-only layout tweaks). An SVG loaded as an image also can't use the app's web fonts, so labels would fall back to a system serif. Still original, hand-written SVG; it just lives in a component. |

Smaller choices:

- **Coordinates:** map pixels use the SVG's own space (origin top-left, y down). `toLatLng` (Phase 1) will flip y for Leaflet. Every number in `config.ts` is in this space.
- **TypeScript 6.0:** typescript-eslint supports TS < 6.1, so don't bump TS past 6.0 until it catches up.
- **Shared files:** `src/config.ts` and `src/types.ts` are imported by Node (vite.config.ts and the data scripts), so their imports use explicit `.ts` extensions and they can't touch browser or Vite-only APIs.
- **Fonts:** IM Fell English (titles, map lettering) and Atkinson Hyperlegible Next (UI and reading text), self-hosted through Fontsource.
- **Region labels** are title-case italic, not capitals: IM Fell's italic capital U looks like a V ("BLVE").
- **Zoom:** max zoom is 1 (2× map pixels). The min zoom is computed by `FitWorldZoom` to fit the whole map for the current screen.
- **Placeholders:** components for later phases return `null`, so nothing pretends to work early.
- **Arc data:** names keep the wiki's "Arc" suffix ("Enies Lobby Arc"), so they never collide with place names. `meta.json` records the latest aired episode and the as-of date (`build-arcs --as-of=YYYY-MM-DD` pretends a different date). Locations get their positions from `scripts/auto-layout.ts` (deterministic: ids seed every nudge).
- **Islands on the map:** `src/data/index.ts` loads the generated JSON and merges `positions.json` over it (`positionSource: 'manual'`). Markers are Leaflet `divIcon`s ([IslandMarker.tsx](src/map/IslandMarker.tsx)); names show from `ZOOM.labels` (−0.5) inward, toggled by a data attribute on the map container so zooming never re-renders markers. Labels point away from the Grand Line's centerline.
- **Dev positioner:** Shift+D ([useDevToggle](src/hooks/useDevToggle.ts)). It's lazy-loaded behind `import.meta.env.DEV`, and the production build contains none of it (checked). Unsaved moves live in localStorage under `gla:dev-positions-draft`.
- **Shared randomness:** the seeded generator lives in `src/utils/random.ts` (no imports), shared by the base map and the Node auto-layout.
- **Arcs with no map stop:** 8 anime-only arcs name no island. Phase 4 must handle an arc with empty `locationIds` (the ship stays where it was).

## Owner decisions

Settled:

- **World layout** (2026-10-01): the default in `config.ts` stands. Red Line down the middle at Mary Geoise, Reverse Mountain on the far-west edge, Paradise west, New World east, East Blue north-west.
- **Wiki User-Agent contact** (2026-10-01): use the repo URL, not an email.
- **Phase 2 review list** (2026-10-01): all items accepted as built. Buggy Side Story and Koby and Helmeppo stay anime-only and off-route; Uta's Past and Elbaph are in; sagas follow the wiki; the eight arcs with no named island have no map stop; the place choices and crew join episodes (Nami 44, Jinbe 980) stand.

Open:

- **Island placement review (Phase 3 stop).** Every island has an automatic position; `data/overrides/positions.json` is empty. The owner can drag islands with Shift+D in `npm run dev`, Save, and commit. Notable auto choices: Sabaody and Marineford sit against the Red Line; Amazon Lily and Rusukaina in the north Calm Belt near Sabaody; Impel Down in the south Calm Belt between Enies Lobby and Marineford; Skypiea floats above Jaya.

The files in [data/generated/review/](data/generated/review/) are now the accepted baseline. Every data build rewrites them, so a new or changed item in their git diff is what needs the owner's eye.

## Open items

- The title cartouche floats over the map's north-west corner, which at full-map zoom covers part of East Blue. Revisit when the ArcCard (also top-left) lands in Phase 5; the title may move into the timeline strip.
- On a phone the whole-world view is a thin strip with empty sea above and below. Phase 4's camera will open on the current arc instead.
- Leaflet's own zoom animation doesn't check reduced motion yet (Phase 6 wires up `useReducedMotion`).
- The bottom timeline strip is empty until Phase 4.
- No favicon yet (Phase 9).
- Usopp leaves the crew during Water 7 and rejoins in episode 323; the crew data keeps him aboard throughout.
