# Grand Line Atlas — Handoff

Where the project stands and what to know before picking it up. Last updated 2026-10-01, at the end of Phase 4.

---

## Status

| | |
|---|---|
| Phase | **Phase 4 (timeline + route) is done** and waiting for the owner's review. Next is Phase 5 (panels + spoiler gate). The Phase 3 placement review is still open (see Owner decisions). |
| Data | Through episode 1180, as of 2026-10-01: 51 arcs, 42 places, 10 crew, 42 route connections. `npm run data:fetch -- --refresh && npm run data:build` updates it. |
| Repo | https://github.com/Zander-M75/grand-line-atlas (public), branch `main` |
| Hosting | None yet (Vercel in Phase 9). |

## Read first

1. [PLAN.md](PLAN.md): scope, phases, hard constraints (§2), working agreements (§9).
2. [README.md](README.md): how to run things, stack, credits.
3. [src/config.ts](src/config.ts): map dimensions, zone layout, timings. The layout comment there explains how the flat map represents the world.
4. [scripts/sources/journey.ts](scripts/sources/journey.ts): the curated arc list (which arcs, which places each visits) that the data build checks against the wiki. The header comments in `scripts/build-arcs.ts` and `scripts/build-locations.ts` record what the wiki pages actually look like.
5. [src/data/voyage.ts](src/data/voyage.ts) and [src/map/journey.ts](src/map/journey.ts): how the route is derived from the visible arcs, and what the map shows at any arc (legs sailed, ship pose, island states, camera focus).
6. [data/generated/review/](data/generated/review/): the TODO-REVIEW items from the last data build (the Phase 2 ones are accepted; see Owner decisions).

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
| Off-route arcs: "a dashed side-route or a highlighted location with a short note" | Highlighted location (dashed brass ring, "Away from the ship" under its name and as a timeline tag); no side-route line | A side route from the ship's last stop misleads for most off-route arcs: Uta's Past would draw a line from Wano across the Red Line to Foosha, and Buggy Side Story one back to Orange Town. A Luffy-only path for the Summit War (Sabaody → Amazon Lily → Impel Down → Marineford → Rusukaina) is possible; see Open in Owner decisions. |
| `route.json` waypoints "added by hand" | Bends live in `scripts/sources/waypoints.ts` (with a reason each); `build-route` (last step of `data:build`) writes `route.json` for every leg in both filler modes | Matches the other curated sources: comments explain each bend, and every generated file stays reproducible. `data:validate` fails if a leg in either mode has no entry. |
| "Show anime-only arcs" toggle in Settings (Phase 5) | Also a switch on the timeline itself, from Phase 4 | Phase 4's acceptance needs a way to toggle filler. It's also where the effect shows. Settings can bind the same store value. |
| Episode range "on hover/focus" for each stop | Tooltip on hover and while dragging; on keyboard focus, the header right above shows the current arc's range | A focus tooltip only repeated the header and covered its tags. Screen readers get the full arc, episodes, and saga from `aria-valuetext`. |
| `useReducedMotion` in Phase 6 | Built in Phase 4 | The Phase 4 camera already animates its pans (Leaflet), so it needed the check. |

Smaller choices:

- **Coordinates:** map pixels use the SVG's own space (origin top-left, y down). `toLatLng` in `src/map/coords.ts` flips y for Leaflet. Every number in `config.ts` is in this space.
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
- **Arcs with no map stop:** 8 anime-only arcs name no island. The ship stays where it was, and the timeline tags them "No island stop".
- **Store:** `src/store/index.ts`. Actions are plain exported functions (`goToArc`, `stepArc`, `goToIndex`, `setShowFiller`, `setSpoilerLimit`), and they guarantee the current arc is always visible and never locked. Visible arcs come from a selector that returns one of two fixed lists (all arcs, canon only), so subscribers get a stable array. `spoilerLimitEpisode: null` means no limit; Phase 5's gate sets it. Locking already works in the store and the slider (locked stops show as "Locked arc" with no name).
- **Route geometry:** the whole voyage is one centripetal Catmull-Rom spline, cut into legs at each island (`src/map/journey.ts`, `src/utils/spline.ts`). Each leg's shape uses its neighbors' points, so toggling filler slightly reshapes the legs next to a filler detour. Legs are cached per arc list.
- **Route drawing:** `RouteLayer` is an SVG overlay in map-pixel space in its own pane (z 450, between the base map and markers). Each leg is one `<path>`, ready for Phase 6's `stroke-dashoffset` and `getPointAtLength`. Strokes are non-scaling (screen pixels).
- **Ship:** a Leaflet marker with an original inline-SVG ship. It sits 30px back along the arriving leg's end tangent, hull on the line, mirrored when sailing west.
- **Islands by state:** current (brass ring, always named), away (dashed ring and note), visited, ahead (faded). Islands visited only by anime-only arcs disappear when filler is hidden.
- **Camera (`ArcCamera`):** opens on the current arc (zoom ≤ `CAMERA.arcZoom`) and moves only if the arc's points leave the view. It never zooms in on its own and clamps the view to the map (`keepOnMap` in `coords.ts`). Phase 6 replaces the moves with `flyTo`.
- **URL:** `restoreFromUrl()` runs in `main.tsx` before the first render (no flash of arc 1). `useUrlSync` writes `?arc=` with `replaceState`, drops `?ep=`, and keeps any other params.
- **Keyboard:** arrows, Home, and End step arcs page-wide (`useKeyboardNav`), except in text fields and selects and on the map, where arrows pan. The slider itself also handles Page Up/Down (by saga).
- **Tests** use the real generated data for arc and journey facts (early-arc facts won't change as new episodes air), and fixtures for the pure voyage logic.

## Owner decisions

Settled:

- **World layout** (2026-10-01): the default in `config.ts` stands. Red Line down the middle at Mary Geoise, Reverse Mountain on the far-west edge, Paradise west, New World east, East Blue north-west.
- **Wiki User-Agent contact** (2026-10-01): use the repo URL, not an email.
- **Phase 2 review list** (2026-10-01): all items accepted as built. Buggy Side Story and Koby and Helmeppo stay anime-only and off-route; Uta's Past and Elbaph are in; sagas follow the wiki; the eight arcs with no named island have no map stop; the place choices and crew join episodes (Nami 44, Jinbe 980) stand.

Open:

- **Island placement review (Phase 3 stop).** Every island has an automatic position; `data/overrides/positions.json` is empty. The owner can drag islands with Shift+D in `npm run dev`, Save, and commit. Notable auto choices: Sabaody and Marineford sit against the Red Line; Amazon Lily and Rusukaina in the north Calm Belt near Sabaody; Impel Down in the south Calm Belt between Enies Lobby and Marineford; Skypiea floats above Jaya. With the route drawn, it's easier to judge: the Grand Line route zigzags because auto-layout alternates islands above and below the centerline. Moving an island far may mean updating the two Reverse Mountain bends in `scripts/sources/waypoints.ts`.
- **Summit War side route (Phase 4).** Off-route arcs only highlight their island. Should Luffy's own path through the Summit War (Sabaody → Amazon Lily → Impel Down → Marineford → Rusukaina) get a dashed side route? It would need a small data flag on those arcs, since a generic rule draws misleading lines for flashbacks and side stories.

The files in [data/generated/review/](data/generated/review/) are now the accepted baseline. Every data build rewrites them, so a new or changed item in their git diff is what needs the owner's eye.

## Open items

- The title cartouche floats over the map's north-west corner, which at full-map zoom covers part of East Blue. Revisit when the ArcCard (also top-left) lands in Phase 5; the title may move into the timeline strip.
- Leaflet's own zoom animation (wheel, +/− buttons) doesn't check reduced motion yet; the arc camera does. Phase 6 should pass `useReducedMotion` to the map's `zoomAnimation`/`fadeAnimation`.
- The prev/next buttons don't announce the new arc to screen readers (the slider does, via `aria-valuetext`). Phase 8 should add a polite live region, worded so it doesn't double up with the slider.
- A leg's curve uses the next island's position for its tangent, so the drawn route bends slightly toward where the voyage goes next. Not visible as a spoiler in practice, but Phase 5 could cut the spline at the spoiler limit.
- The timeline strip is 7.5rem tall (8.5rem under 640px, where the details wrap). Long arc names truncate with an ellipsis on phones.
- No favicon yet (Phase 9).
- Usopp leaves the crew during Water 7 and rejoins in episode 323; the crew data keeps him aboard throughout.
