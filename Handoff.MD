# Grand Line Atlas — Handoff

Where the project stands and what to know before picking it up. Last updated 2026-10-02, at the end of Phase 6.

---

## Status

| | |
|---|---|
| Phase | **Phase 6 (animation + polish) is done** and waiting for the owner's review. Next is Phase 7 (content pass: summaries). The Phase 3 placement review and the Phase 5 questions are still open, and Phase 6 adds a few (see Owner decisions). |
| Data | Through episode 1180, as of 2026-10-01: 51 arcs, 42 places, 10 crew, 42 route connections. `npm run data:fetch -- --refresh && npm run data:build` updates it. |
| Repo | https://github.com/Zander-M75/grand-line-atlas (public), branch `main` |
| Hosting | None yet (Vercel in Phase 9). |

## Read first

1. [PLAN.md](PLAN.md): scope, phases, hard constraints (§2), working agreements (§9).
2. [README.md](README.md): how to run things, stack, credits.
3. [src/config.ts](src/config.ts): map dimensions, zone layout, timings. The layout comment there explains how the flat map represents the world.
4. [scripts/sources/journey.ts](scripts/sources/journey.ts): the curated arc list (which arcs, which places each visits) that the data build checks against the wiki. The header comments in `scripts/build-arcs.ts` and `scripts/build-locations.ts` record what the wiki pages actually look like.
5. [src/data/voyage.ts](src/data/voyage.ts) and [src/map/journey.ts](src/map/journey.ts): how the route is derived from the visible arcs, and what the map shows at any arc (legs sailed, ship pose, island states, camera focus).
6. [src/data/spoilers.ts](src/data/spoilers.ts) and [src/store/index.ts](src/store/index.ts): the spoiler rules (locked, in progress, known arcs, crew aboard) and the store actions around them (the gate, links past the limit, saving the answer).
7. [src/animation/voyage.ts](src/animation/voyage.ts), [src/map/Voyage.tsx](src/map/Voyage.tsx), and [src/map/voyageAnimator.ts](src/map/voyageAnimator.ts): what animates when the timeline moves (pure decisions, tested), and how it's played (GSAP, masks, the ship marker). [src/map/ArcCamera.tsx](src/map/ArcCamera.tsx) and [src/map/covers.ts](src/map/covers.ts): the camera and how it keeps clear of the panels.
8. [data/generated/review/](data/generated/review/): the TODO-REVIEW items from the last data build (the Phase 2 ones are accepted; see Owner decisions).

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
| "Show anime-only arcs" toggle in Settings (Phase 5) | In Settings, and also a switch on the timeline itself | Phase 4's acceptance needs a way to toggle filler. It's also where the effect shows. Both bind the same store value. |
| Episode range "on hover/focus" for each stop | Tooltip on hover and while dragging; on keyboard focus, the header right above shows the current arc's range | A focus tooltip only repeated the header and covered its tags. Screen readers get the full arc, episodes, and saga from `aria-valuetext`. |
| `useReducedMotion` in Phase 6 | Built in Phase 4 | The Phase 4 camera already animates its pans (Leaflet), so it needed the check. |
| Ocean: animate the turbulence filter's base frequency | Two copies of the wave marks, each under a fixed filter at a different base frequency, cross-fading with CSS opacity; hidden while the zoom changes | Redrawing an `feTurbulence` filter over the map dropped frames (33–50 ms frames at the 95th percentile, measured in headless Chromium). Cross-fading two finished layers costs nothing per frame, and the sea still drifts between two swell states. |
| Camera: `flyTo` the destination | `panTo` (animated) when the zoom stays the same; `flyTo` when it has to change, and always for the three dramatic crossings | `flyTo` arcs out and back in, which redraws every SVG layer each frame; with the ocean and route that was the main cost of a settled scrub. A pan slides the map with a CSS transform. |
| Rapid scrubbing: "snap, then animate only the final step" | Each change cancels what's playing; within `scrubThreshold` of the last change, the map shows the final arc's starting frame (its legs hidden, ship at the start) and sails once the timeline is quiet for that long | Never more than one tween alive, and the final step still animates. Jumps forward snap everything but the last arc. |
| Going backward un-draws the segment | One step back un-draws the arc being left (the ship rewinds, still facing forward); a jump back snaps | Un-drawing several arcs' legs reads as noise. Turning the ship around for a rewind would flip it at both ends. |
| Ship "rotates to face its direction of travel" | Mirrored east/west, tilted with the heading up to ±35° | It's a side-view ship; rotating it to 90° reads as sinking. |
| Sound: "tiny self-made or CC0 audio files" | Synthesized with the Web Audio API (brown-noise waves with a slow swell, a two-note chime); no files | Nothing to ship, license, or credit, and it's tiny. Loaded on first use. |
| `Ship.tsx` component | `src/map/ship.ts`, an imperative Leaflet marker | The animation moves it every frame; going through React props would fight react-leaflet's own position updates. |
| Intro: "Red Line and Grand Line draw in" | A title card: the two lines draw in as a cross over sea fog, the title plate fades in over the crossing, then the fog lifts onto the map | The map behind is framed on the viewer's arc, so lines drawn over it wouldn't line up with the real ones. |
| ArcCard "floats top-left", separate from the title | One "logbook" panel top-left: title, current arc, crew | Two or three floating cards in one corner read as clutter; one ruled sheet reads as a chart cartouche. Resolves the Phase 4 note about the title covering East Blue. |
| Islands past the limit "hidden or shown as '?'" | Hidden | "?" markers would still leak the route's shape and the special places (a floating sky marker, an undersea one). Hidden means the chart fills in as you watch. |
| Spoiler limit only in localStorage | Settings too (`gla:settings`) | A reduce-motion override that resets every visit is an accessibility bug. Only changes the viewer makes are saved; filler turned on by a link lasts the session (§7 Phase 4). |
| Settings: weather and sound toggles | Added in Phase 6 with the features | Same rule as the placeholders: nothing offered a setting that did nothing. |
| Footer "icon credits" | "Map and icons are original" | No icon set is used; every icon is hand-written SVG in `src/ui/icons.tsx`. |

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
- **Store:** `src/store/index.ts`. Actions are plain exported functions (`goToArc`, `stepArc`, `goToIndex`, `setShowFiller`, `setSetting`, `setSpoilerLimit`, `chooseSpoilerLimit`, `openLinkedArc`, `selectLocation`), and they guarantee the current arc is always visible and never locked. Visible arcs come from a selector that returns one of two fixed lists (all arcs, canon only), so subscribers get a stable array. `spoilerLimitEpisode: null` means no limit. `setSpoilerLimit` is session-only; `chooseSpoilerLimit` (the gate and Settings) also saves it.
- **Route geometry:** the whole voyage is one centripetal Catmull-Rom spline, cut into legs at each island (`src/map/journey.ts`, `src/utils/spline.ts`). Each leg's shape uses its neighbors' points, so toggling filler slightly reshapes the legs next to a filler detour. Legs are cached per arc list.
- **Route drawing:** `RouteLayer` is an SVG overlay in map-pixel space in its own pane (z 450, between the base map and markers). Each leg is a `<g data-leg="from>to">` holding a casing and a line `<path>`; the voyage animation masks these groups. Strokes are non-scaling (screen pixels). The wake dots live in the same overlay, under the legs.
- **Ship:** a Leaflet marker with an original inline-SVG ship (`src/map/ship.ts`). Moored, it sits 30px back along the arriving leg's end tangent, hull on the line, mirrored when heading west and tilted with its heading; it bobs (CSS). Sailing, it's anchored on the hull and moved every frame.
- **Islands by state:** current (brass ring, always named), away (dashed ring and note), visited, ahead (faded). Islands visited only by anime-only arcs disappear when filler is hidden.
- **Camera (`ArcCamera`):** opens on the current arc (zoom ≤ `CAMERA.arcZoom`) and moves only if the arc's points leave the view or sit under a panel (checked against the panels' actual boxes). It never zooms in on its own, except the dramatic crossings, which frame at `CAMERA.arcZoom` or closer. Framing centers the points in the part of the screen the panels leave clear (`coverInsets` in `covers.ts` treats each panel as hugging the edge it takes least from), and only that clear part is clamped to the map, so the area under the logbook may show past the map's edge. Panels opt in with a `data-map-cover` attribute. Opening an island under its own panel pans it into the clear. While scrubbing, it waits for the timeline to settle.
- **Voyage animation:** `Voyage.tsx` works out the motion while rendering (so legs being un-drawn are still there in the first frame), then plays it in a layout effect; each new change cancels the last. The reveal is an SVG mask per animating leg (a white stroke dashed to the drawn length), created and removed imperatively in the route's `<defs>`. The ship trails the drawing tip by its mooring distance and finishes exactly where it moors. The wake is a pool of 8 circles faded with the Web Animations API. jsdom has no `getTotalLength`, so tests always get the snapped result.
- **Ship layering:** the ship now sits under the island markers (`zIndexOffset: -1000`), so the name of the island it's moored at stays readable over it.
- **Leaflet's zoom animation** follows reduced motion through its private `_zoomAnimated` flag (`MapMotion.tsx`); the option itself is only read at startup.
- **Weather zones** are `div`s placed with Leaflet's `svgOverlay` (it positions and sizes any element), in their own pane above the markers with pointer events off. Each tsParticles load gets its own id: without one, v4 reused an id and replaced the running zone. `vite.config.ts` pre-bundles tsParticles, or the dev server bundled two copies of its engine.
- **Intro state** is `intro` in the store. `startIntro()` runs in `main.tsx` (not in `restoreSaved`, so tests don't get it); the spoiler gate waits for it, and the app is inert under it. Skipped with reduced motion and not marked as seen then, so turning motion back on shows it once.
- **Framer Motion** runs through `LazyMotion` with `domAnimation` and `m` components (`strict`), about 14 KB gzipped less than `motion`. Under reduced motion `useUiTransition()` gives every transition zero duration.
- **Bundle:** the main chunk is 195 KB gzipped (was 132 KB at Phase 5; Framer Motion and GSAP). tsParticles (≈45 KB gzipped across its chunks) and the sound module load on demand.
- **Performance** was measured in headless Chromium with software rendering (no GPU), which is a worst case: idle and single steps hold 60 fps; a fast 12-arc scrub ending in a camera flight and the first weather load has a median frame of 16.7 ms and a 95th percentile of 33 ms. Worth a check on a real mid-range laptop.
- **URL:** `restoreFromUrl()` runs in `main.tsx` before the first render (no flash of arc 1). `useUrlSync` writes `?arc=` with `replaceState`, drops `?ep=`, and keeps any other params.
- **Keyboard:** arrows, Home, and End step arcs page-wide (`useKeyboardNav`), except in text fields and selects and on the map, where arrows pan. The slider itself also handles Page Up/Down (by saga).
- **Spoilers:** `selectKnownArcs` (visible arcs minus locked ones, the in-progress arc cut to its first stop) feeds `useJourney`, so the route, islands, ship, camera, and island panel can't show anything past the limit. It's cached per list and limit, so its array identity is stable. Because the spline is built from known arcs only, the last leg no longer bends toward an island the viewer hasn't reached (the Phase 4 open item).
- **Gate:** `restoreSaved()` then `restoreFromUrl()` run in `main.tsx` before the first render. First visit: a stand-in limit of episode 1 (not saved) and the welcome gate. A link past the limit (`openLinkedArc`) lands on `selectFrontierArc` (the arc containing the limit episode, canon preferred) and keeps the requested arc in `gate.requestedArcId` until `chooseSpoilerLimit` allows it. The app root is `inert` while the gate is open, and `useKeyboardNav` ignores keys.
- **"I'm caught up"** stores `null` (no limit), not the latest episode, so a data refresh opens new arcs. A typed episode past the latest aired one is stored as typed.
- **Island panel:** opens from a marker click or Enter/Space on a focused marker (Leaflet makes markers focusable `role=button` but doesn't press them). Focus moves to its heading and returns to the marker on Escape or close; clicking open sea closes it. Arc rows are real `?arc=` links (open in new tab works) that jump the timeline on a plain click.
- **Settings** is a disclosure (button + panel in tab order), not a modal. Escape inside it closes it first (it calls `preventDefault`, which the island panel's window listener respects).
- **Shared UI:** `paper.module.css` holds the panel surface, eyebrow, heading, icon-button, and link styles, `composes`-d into each panel. `Switch`, `Tag`, and `ArcTags` are shared by the timeline, logbook, and panels. The map container is `isolation: isolate`, so overlays need only z-indexes 1–3 (the gate uses 2000).
- **Phones (≤640px):** the logbook drops the arc's name, saga, and tags (the timeline right below has them) and hides itself if there's no summary or progress note; the crew folds to one line by default; the island panel is a bottom sheet; the footer stacks into two lines (below 1100px) and drops its extras.
- **Tests** use the real generated data for arc and journey facts (early-arc facts won't change as new episodes air), and fixtures for the pure voyage logic.

## Owner decisions

Settled:

- **World layout** (2026-10-01): the default in `config.ts` stands. Red Line down the middle at Mary Geoise, Reverse Mountain on the far-west edge, Paradise west, New World east, East Blue north-west.
- **Wiki User-Agent contact** (2026-10-01): use the repo URL, not an email.
- **Phase 2 review list** (2026-10-01): all items accepted as built. Buggy Side Story and Koby and Helmeppo stay anime-only and off-route; Uta's Past and Elbaph are in; sagas follow the wiki; the eight arcs with no named island have no map stop; the place choices and crew join episodes (Nami 44, Jinbe 980) stand.

Open (Phase 6):

- **Intro look.** A title card (fog, the Red Line and Grand Line drawing in as a cross, the title plate) rather than lines over the real map. Easy to restyle in `src/ui/Intro.tsx` and `Intro.module.css`.
- **Dramatic camera moves.** The three crossings (`CAMERA.dramatic`) always fly, zooming in to `CAMERA.arcZoom` if the viewer is farther out. Other moves never zoom in.
- **Weather only near islands the viewer may know**, but any known island, not only ones the crew has reached. (Snow shows at Drum Island while the ship is still in East Blue, if the limit is past Drum.) Limiting it to visited and current islands is a small change.
- **Sound** is synthesized (no files). If you'd prefer recorded CC0 sounds, they'd replace `src/audio/soundscape.ts`.

Open (Phase 5):

- **Arc picker spoilers.** The gate's "or the arc you're on" picker lists every arc name, which can hint at what's ahead (a note under it says so). Alternatives: only list arcs up to the current limit in Settings, or drop the picker and keep the episode field. Kept as PLAN.md asks for now.
- **Where a first visit lands.** After answering the gate, a viewer stays on the first arc (unless they followed a link). Landing on their own arc (or the latest for "caught up", with the whole route drawn) is a one-line change if you'd prefer it.

Open (earlier):

- **Island placement review (Phase 3 stop).** Every island has an automatic position; `data/overrides/positions.json` is empty. The owner can drag islands with Shift+D in `npm run dev`, Save, and commit. Notable auto choices: Sabaody and Marineford sit against the Red Line; Amazon Lily and Rusukaina in the north Calm Belt near Sabaody; Impel Down in the south Calm Belt between Enies Lobby and Marineford; Skypiea floats above Jaya. With the route drawn, it's easier to judge: the Grand Line route zigzags because auto-layout alternates islands above and below the centerline. Moving an island far may mean updating the two Reverse Mountain bends in `scripts/sources/waypoints.ts`.
- **Summit War side route (Phase 4).** Off-route arcs only highlight their island. Should Luffy's own path through the Summit War (Sabaody → Amazon Lily → Impel Down → Marineford → Rusukaina) get a dashed side route? It would need a small data flag on those arcs, since a generic rule draws misleading lines for flashbacks and side stories.

The files in [data/generated/review/](data/generated/review/) are now the accepted baseline. Every data build rewrites them, so a new or changed item in their git diff is what needs the owner's eye.

## Open items

- Arc and island summaries are empty until Phase 7, so the logbook shows none (and on phones the arc section is hidden unless the viewer is partway through it).
- The island panel and settings don't trap focus on phones yet (Phase 8 per PLAN.md); the spoiler gate already does, via `inert`.
- Locked timeline stops still show their episode range in the hover tooltip (no name, no anime-only tag). Episode numbers aren't story content, and the range says when an arc unlocks.
- The dev server's file watcher didn't pick up edits in the Claude Code sandbox this phase (a restart fixed it); worth knowing if HMR looks stale.
- Turning reduced motion back off mid-visit: layers Leaflet added while it was on (islands that appeared since) skip their zoom transition until a reload. Cosmetic, and only after toggling.
- The reveal mask's width is set from the zoom when a leg starts drawing; zooming far out mid-draw can clip the line's edges until it finishes (under a second).
- A leg starting at an island loses its round start cap while it draws (the mask is butt-ended), then gains it when the mask comes off.
- The prev/next buttons don't announce the new arc to screen readers (the slider does, via `aria-valuetext`). Phase 8 should add a polite live region, worded so it doesn't double up with the slider.
- The timeline strip is 7.5rem tall (8.5rem under 640px, where the details wrap). Long arc names truncate with an ellipsis on phones.
- No favicon yet (Phase 9).
- Usopp leaves the crew during Water 7 and rejoins in episode 323; the crew data keeps him aboard throughout.
