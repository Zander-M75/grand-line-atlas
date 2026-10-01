# PLAN.md — Grand Line Atlas

An interactive, animated map of the One Piece world that traces the Straw Hat Pirates' journey arc by arc, **following the anime**.

> **Source of truth is the anime, not the manga.** Arc order, arc boundaries, and spoiler limits are all based on anime episode numbers. Anime-only (filler) arcs are included. Manga chapter numbers are optional reference data only.

This file is the source of truth for the project. Read it fully before starting. Work through the phases in order, finish each phase's acceptance criteria before moving on, and stop at the end of each phase so the owner (Zander) can review.

---

## 1. Project Summary

**What it is:** A single-page web app showing an original, stylized map of the One Piece world. A timeline slider steps through every anime arc in episode order. As it moves, the route draws itself across the ocean, a ship sails to the next island, the camera flies to it, and side panels show the arc, the island, and who's on the crew at that point.

**Why it exists:** Portfolio piece. It should show strong front-end engineering, clean data modeling, thoughtful animation, and good product judgment. Anyone should understand it within five seconds of opening it.

**Working title:** Grand Line Atlas (placeholder; easy to rename via a single config constant).

### Goals
- Feels alive: animated route, moving ship, smooth camera, living ocean.
- Data-driven: all islands, arcs, and crew events come from JSON, not hardcoded components.
- Spoiler-aware: viewers set the episode they're on, and nothing past it is shown.
- Filler-aware: anime-only arcs are included and visually marked, with a toggle to hide them.
- Shareable: the URL reflects the current arc.
- Works well on desktop and mobile.
- Accessible: respects reduced motion, keyboard navigable, readable contrast.

### Non-goals (for v1)
- No user accounts, backend, or database.
- No WebGL ocean shader (possible v2).
- No coverage of anime movies, specials, or TV specials. Series episodes only.
- No episode-by-episode breakdown inside an arc; the arc is the smallest unit on the timeline.
- No characters beyond the Straw Hat crew in the crew panel.

---

## 2. Hard Constraints (read before writing any code)

1. **No official artwork.** Do not download, scrape, embed, trace, or hotlink any official One Piece art, anime screenshots, manga panels, logos, or the official world map. All visuals are original: hand-coded SVG, CSS, and generic icon sets.
2. **Do not draw known characters.** Crew members are represented by text, initials, or generic icons (e.g., a skull-and-crossbones icon, a straw hat silhouette is NOT allowed since it's character-identifying). Keep it typographic.
3. **Attribution.** Text data pulled from the One Piece Fandom wiki is CC-BY-SA. Add a visible footer credit linking to the wiki and note the license in the README. Any CC-BY icon sets (e.g., game-icons.net) get credited too.
4. **Write summaries originally.** Arc and island descriptions must be short (1–2 sentences), written in our own words. Never copy wiki prose verbatim into the UI.
5. **Positions are approximate.** Canon geography is inconsistent. The README and an in-app "About" note should say island positions are approximate.
6. **Be polite to the wiki API.** Throttle to ~1 request/second, set a descriptive User-Agent, and cache every raw response to disk so scripts never re-fetch unnecessarily.

---

## 3. Tech Stack

| Concern | Choice | Notes |
|---|---|---|
| Build tool | Vite | React + TypeScript template |
| UI | React 18 + TypeScript | Strict mode on |
| Map | Leaflet + react-leaflet | `L.CRS.Simple` with pixel coordinates |
| UI animation | Framer Motion | Panels, cards, titles |
| Sequence animation | GSAP | Route drawing, ship movement, intro |
| Particles | tsParticles (slim bundle) | Weather effects, phase 6 only |
| Styling | CSS Modules + CSS custom properties | Theme tokens in one file |
| State | Zustand | Small global store (current arc, spoiler limit, settings) |
| Routing | None; sync state with URL query params manually | `?arc=enies-lobby` |
| Data scripts | Node (TypeScript via `tsx`) | Lives in `/scripts`, not shipped to client |
| Wikitext parsing | `wtf_wikipedia` | Inspect real wikitext before relying on it |
| Testing | Vitest + React Testing Library; Playwright for one smoke test | |
| Lint/format | ESLint + Prettier | |
| Deploy | Vercel | Static build |

Keep dependencies lean. Do not add a library without a clear reason; note any additions in the README.

---

## 4. Project Structure

```
grand-line-atlas/
├── PLAN.md
├── README.md
├── public/
│   └── map/
│       └── world.svg              # original base map
├── scripts/
│   ├── fetch-wiki.ts              # pulls raw wikitext via MediaWiki API, caches to data/raw
│   ├── build-locations.ts         # parses raw → data/generated/locations.json
│   ├── build-arcs.ts              # parses raw → data/generated/arcs.json
│   ├── auto-layout.ts             # assigns starting x/y positions
│   └── validate-data.ts           # schema + referential integrity checks
├── data/
│   ├── raw/                       # cached API responses (gitignored)
│   ├── generated/                 # script output, committed
│   └── overrides/
│       └── positions.json         # hand-tuned x/y from the dev positioning tool
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── config.ts                  # map size, timings, title, feature flags
│   ├── types.ts                   # shared data types
│   ├── data/                      # loads + merges generated data with overrides
│   ├── store/                     # Zustand store
│   ├── hooks/                     # useReducedMotion, useUrlSync, useKeyboardNav...
│   ├── map/
│   │   ├── WorldMap.tsx
│   │   ├── IslandMarker.tsx
│   │   ├── RouteLayer.tsx
│   │   ├── Ship.tsx
│   │   ├── OceanEffects.tsx
│   │   └── DevPositioner.tsx      # dev-only drag tool
│   ├── ui/
│   │   ├── Timeline.tsx
│   │   ├── ArcCard.tsx
│   │   ├── IslandPanel.tsx
│   │   ├── CrewPanel.tsx
│   │   ├── SpoilerGate.tsx
│   │   ├── Intro.tsx
│   │   ├── SettingsMenu.tsx
│   │   └── Footer.tsx
│   ├── animation/                 # GSAP timelines, easing constants
│   └── styles/
│       ├── tokens.css
│       └── global.css
└── tests/
```

---

## 5. Data Model

Define these in `src/types.ts`. Scripts and app share them.

```ts
export type Region =
  | 'east-blue' | 'west-blue' | 'north-blue' | 'south-blue'
  | 'paradise' | 'new-world' | 'calm-belt' | 'red-line' | 'sky' | 'undersea' | 'other';

export interface Location {
  id: string;              // kebab-case slug, e.g. "water-7"
  name: string;            // display name
  region: Region;
  x: number;               // map pixel coords (CRS.Simple)
  y: number;
  summary: string;         // 1–2 original sentences
  wikiTitle: string;       // page title on the wiki, for attribution links
  arcIds: string[];        // arcs that take place here
  positionSource: 'auto' | 'manual';
}

export interface Arc {
  id: string;              // e.g. "enies-lobby"
  name: string;
  saga: string;            // e.g. "Water 7 Saga"
  order: number;           // 1-based, sorted by first episode
  episodes: [number, number]; // REQUIRED. Anime episode range, inclusive. End may equal start for ongoing arcs.
  filler: boolean;         // true for anime-only arcs
  offRoute?: boolean;      // true when the crew's ship isn't traveling (see Phase 4)
  locationIds: string[];   // in visit order within the arc
  chapters?: [number, number]; // optional manga reference, never used for logic
  summary: string;         // 1–2 original sentences, spoiler-light
  ongoing?: boolean;
}

export interface CrewMember {
  id: string;              // e.g. "zoro"
  name: string;
  role: string;            // e.g. "Swordsman"
  joinedArcId: string;     // arc in which they officially join
  joinedEpisode: number;   // anime episode they're officially aboard from
}

export interface RouteSegment {
  fromLocationId: string;
  toLocationId: string;
  arcId: string;           // arc this segment leads into
  waypoints?: [number, number][]; // optional bends so routes follow sea lanes
}
```

Files the app consumes (all in `data/generated/` unless noted):
- `locations.json`: `Location[]`
- `arcs.json`: `Arc[]`
- `crew.json`: `CrewMember[]` (hand-written; small)
- `route.json`: `RouteSegment[]` (derived from arcs' location order, waypoints added by hand). Segments must exist both **with** and **without** filler arcs, since hiding filler changes which islands connect (see Phase 4).
- `data/overrides/positions.json`: `Record<locationId, {x, y}>`, merged over auto positions at load time

### Seed arc list (anime arcs, in episode order)

Use this as the starting skeleton. Filler (anime-only) arcs are marked **[F]**. **Pull every episode range from the wiki in Phase 2 and verify every name and position against it.** Episode ranges are intentionally left out here so nothing gets hardcoded from memory. Don't trust this list blindly.

East Blue Saga: Romance Dawn, Orange Town, Syrup Village, Baratie, Arlong Park, Buggy's Crew Adventure [F], Loguetown
Arabasta Saga: Warship Island [F], Reverse Mountain, Whisky Peak, Koby and Helmeppo [F], Little Garden, Drum Island, Arabasta
Post-Arabasta [F], Goat Island [F], Ruluka Island [F]
Sky Island Saga: Jaya, Skypiea
G-8 [F]
Water 7 Saga: Long Ring Long Land, Ocean's Dream [F], Foxy's Return [F], Water 7, Enies Lobby, Post-Enies Lobby
Ice Hunter [F]
Thriller Bark Saga: Thriller Bark
Spa Island [F]
Summit War Saga: Sabaody Archipelago, Amazon Lily, Impel Down, Little East Blue [F], Marineford, Post-War
Fish-Man Island Saga: Return to Sabaody, Fish-Man Island
Z's Ambition [F]
Dressrosa Saga: Punk Hazard, Caesar Retrieval [F], Dressrosa
Silver Mine [F]
Four Emperors Saga: Zou, Marine Rookie [F], Whole Cake Island, Levely, Wano Country, Cidre Guild [F]
Final Saga: Egghead, and whatever has aired since (mark the latest airing arc `ongoing: true`)

**Anime-specific quirks to handle:**
- **Interleaved filler.** A few filler arcs air in the middle of a canon arc (e.g., Little East Blue during Impel Down, Cidre Guild during Wano). Sort by first episode, and allow episode ranges to overlap or nest. Don't assume arcs are strictly back-to-back.
- **Recap and special episodes** inside an arc's range stay part of that arc. Don't create arcs for them.
- **Anime-only islands.** Many filler arcs take place at islands that don't exist in the manga (e.g., Warship Island, Goat Island, the G-8 base). They still get `Location` entries and map positions. Mark them in data so the UI can style them as filler.
- **Off-ship arcs.** Some arcs (Amazon Lily, Impel Down, Marineford, Levely, and some filler like Little East Blue) don't follow the crew's ship. Mark these `offRoute: true` and handle them as described in Phase 4.
- **Airing status.** The anime may be mid-arc or on break when you build this. Check the wiki for the latest aired episode and set the final arc's end episode to that.

### Crew

Hand-write `crew.json` for the ten Straw Hats. Verify each member's `joinedArcId` and `joinedEpisode` against the wiki's anime episode pages rather than assuming. Some joins are debatable (e.g., when a member is "officially" aboard vs. first traveling with the crew); pick the official join point and add a code comment where it's ambiguous.

---

## 6. Map Coordinate System

- Base map: `4000 × 2000` px, defined in `config.ts` as `MAP_WIDTH` / `MAP_HEIGHT`.
- Leaflet bounds: `[[0, 0], [MAP_HEIGHT, MAP_WIDTH]]`. Remember Leaflet's CRS.Simple uses `[y, x]` order. Wrap this in a single helper `toLatLng(x, y)` and never convert inline anywhere else.
- Layout (a design choice, adjustable to match reference maps):
  - **Red Line:** vertical band centered at `x = 2000`.
  - **Grand Line:** horizontal band centered at `y = 1000`, roughly 260px tall.
  - **Calm Belts:** thinner bands directly above and below the Grand Line.
  - **Four Blues:** the four quadrants outside the Calm Belts. East Blue placement should match the reference the owner chooses.
  - **Reverse Mountain:** where the Red Line meets the Grand Line on the starting side.
  - **Paradise** spans the Grand Line from Reverse Mountain to the Red Line; **New World** continues on the far side.
  - **Sky islands** (Skypiea) render as a small inset/floating marker above Jaya.
  - **Fish-Man Island** renders as an undersea marker beneath the Red Line crossing.
- Put every one of these zone boundaries in `config.ts` so layout tweaks don't require code changes.

---

## 7. Development Phases

Each phase lists tasks and acceptance criteria. **Stop and summarize at the end of every phase.** Don't skip ahead.

---

### Phase 0 — Project Setup

**Tasks**
1. Scaffold with `npm create vite@latest grand-line-atlas -- --template react-ts`.
2. Install core deps: `leaflet react-leaflet zustand framer-motion gsap`.
3. Install dev deps: `typescript tsx vitest @testing-library/react @testing-library/jest-dom jsdom eslint prettier @types/leaflet`.
4. Configure ESLint + Prettier, strict TypeScript, path alias `@/` → `src/`.
5. Create the folder structure from Section 4 with placeholder files.
6. Add `config.ts` with map dimensions, zone boundaries, animation durations, and `APP_TITLE`.
7. Add `tokens.css` with color tokens (ocean, land, Red Line, route, text, panel backgrounds), font stacks, spacing scale, and radii. Include a dark-on-parchment palette.
8. Add npm scripts: `dev`, `build`, `preview`, `test`, `lint`, `data:fetch`, `data:build`, `data:validate`.
9. Initialize git with a sensible `.gitignore` (include `data/raw/`).

**Acceptance criteria**
- `npm run dev` shows a blank styled page with the app title.
- `npm run lint` and `npm run test` pass (one trivial test is fine).

---

### Phase 1 — Base Map + Map Shell

**Tasks**
1. Hand-code `public/map/world.svg` at 4000×2000:
   - Ocean background with a subtle gradient.
   - Red Line as a textured vertical band.
   - Grand Line as a lighter horizontal band with soft edges.
   - Calm Belts as a slightly desaturated, glassy band.
   - A faint compass rose and grid lines for flavor.
   - Labels for the four Blues, Paradise, New World, Red Line, Calm Belt.
   - Original styling only. Do not reference or trace the official map.
2. Build `WorldMap.tsx` using `MapContainer` with `crs={L.CRS.Simple}`, `ImageOverlay` for the SVG, sensible `minZoom`/`maxZoom`, and `maxBounds` with some padding so users can't pan into the void.
3. Remove default Leaflet attribution clutter; we handle credits in the footer.
4. Build `toLatLng` helper and unit-test it.
5. Add a dev-only coordinate logger: clicking the map logs `{x, y}` to the console (gated behind `import.meta.env.DEV`).
6. Make the map fill the viewport, with room reserved for the timeline at the bottom.

**Acceptance criteria**
- Map renders crisply at all zoom levels, pans and zooms smoothly.
- Clicking in dev logs correct pixel coordinates (verify by clicking the four corners).
- Works on a mobile viewport with touch pan/zoom.

---

### Phase 2 — Data Pipeline

**Tasks**
1. **`scripts/fetch-wiki.ts`**
   - Base URL: `https://onepiece.fandom.com/api.php`.
   - Fetch category members with `action=query&list=categorymembers&cmtitle=Category:<name>&cmlimit=500&format=json`, handling `cmcontinue` for pagination. Start with categories for islands, locations, story arcs, **anime-only (filler) arcs, and anime episodes**. **Inspect what categories actually exist before hardcoding names.** Arc pages and episode pages are the main sources for episode ranges; also check the wiki's episode guide page for the latest aired episode.
   - For each page, fetch wikitext with `action=parse&page=<title>&prop=wikitext&format=json`.
   - Cache each response to `data/raw/<sanitized-title>.json`. Skip fetching if the cache file exists unless `--refresh` is passed.
   - Throttle to 1 request/second. Set a User-Agent like `GrandLineAtlas/0.1 (portfolio project; contact: <owner email placeholder>)`.
   - Retry with backoff on 429/5xx, max 3 attempts.
   - **Text only.** Never request image info or download files.
2. **Inspect before parsing.** Open several cached island and arc pages, look at the actual infobox template names and field names, and write down what you find in a short comment block at the top of the build scripts. Don't guess field names.
3. **`scripts/build-locations.ts`**
   - Parse infoboxes with `wtf_wikipedia`, extract name and region, map region strings to the `Region` union, and log any that don't map cleanly.
   - Only include locations that appear in at least one arc in `arcs.json` (canon or filler). The goal is the Straw Hats' journey in the anime, not every island ever mentioned.
   - Anime-only islands may have thin or missing infoboxes. Fall back to the region of the surrounding canon arcs and add them to the review list.
   - Leave `summary` empty for now; summaries get written in Phase 7.
4. **`scripts/build-arcs.ts`**
   - Build arcs from the seed list in Section 5, verifying names and order, and pulling **anime episode ranges** from the wiki. Set `filler` correctly for every arc. Chapter ranges are optional; fill them only where the data is clean.
   - Sort by first episode. Detect and report overlapping/nested ranges (expected for interleaved filler) without treating them as errors.
   - Assign `locationIds` in visit order. Where the wiki data isn't clear, flag it in a `TODO-REVIEW` list printed at the end rather than guessing silently.
5. Hand-write `data/generated/crew.json` per Section 5.
6. **`scripts/validate-data.ts`**
   - Validate every file against the types (use a small zod schema).
   - Check referential integrity: every `locationId` in arcs exists, every `joinedArcId` exists, arc `order` is unique and contiguous, no duplicate ids.
   - Check episodes: every arc has a valid range (start ≤ end), every crew `joinedEpisode` falls inside its `joinedArcId` range, and there are no unexplained gaps in episode coverage between arcs (report gaps as warnings).
   - Exit non-zero on any failure.

**Acceptance criteria**
- `npm run data:fetch && npm run data:build && npm run data:validate` runs clean end to end.
- A second `data:fetch` run makes zero network requests (all cached).
- A printed `TODO-REVIEW` list exists for anything the owner needs to confirm.
- **Stop here and show the owner the arc list and review items before continuing.**

---

### Phase 3 — Island Placement

**Tasks**
1. **`scripts/auto-layout.ts`**
   - Grand Line islands (`paradise`, `new-world`): space them along the Grand Line by arc order. Paradise islands fill from Reverse Mountain toward the Red Line; New World islands continue past it. Add small deterministic vertical jitter (seeded by id) so they don't sit on a perfectly straight line.
   - East Blue islands: scatter within the East Blue quadrant in arc order, trending toward Reverse Mountain, using a seeded jitter.
   - Special cases: Skypiea above Jaya, Fish-Man Island beneath the Red Line crossing, Mary Geoise on top of the Red Line, Impel Down / Enies Lobby / Marineford placed per the owner's reference.
   - Write positions into `locations.json` with `positionSource: 'auto'`.
2. **`DevPositioner.tsx`** (dev builds only)
   - Toggle with a keyboard shortcut (e.g., `Shift+D`).
   - Makes island markers draggable.
   - On drag end, updates an in-memory overrides object.
   - "Export" button downloads/copies `positions.json` so the owner can save it to `data/overrides/`.
   - Shows a faint overlay of zone boundaries from `config.ts` to help placement.
3. Data loader merges `overrides/positions.json` over auto positions and marks those `positionSource: 'manual'`.
4. Render all islands with `IslandMarker.tsx`: a small styled dot plus a label that appears at higher zoom levels to avoid clutter.

**Acceptance criteria**
- All journey islands appear on the map in plausible regions.
- Owner can drag islands in dev mode, export positions, commit them, and see them persist after reload.
- Labels don't overlap badly at default zoom.
- **Stop for owner placement review.**

---

### Phase 4 — Timeline + Route (core feature, no fancy animation yet)

**Tasks**
1. **Zustand store** with `currentArcId`, `spoilerLimitEpisode`, `selectedLocationId`, `settings` (`showFiller`, `reducedMotion`, `sound`, `weather`). Derive the list of visible arcs from `showFiller` with a selector; never keep two copies of the arc list.
2. **`Timeline.tsx`**
   - Horizontal slider snapped to visible arcs, with saga groupings shown as labeled segments.
   - Each stop shows the arc's episode range on hover/focus (e.g., "Ep. 264–312").
   - Filler arcs get a distinct style (e.g., hatched or dimmer tick with an "Anime-only" tag) so they read as different at a glance.
   - Prev/next buttons, plus keyboard: left/right arrows step arcs, Home/End jump.
   - Current arc name and episode range displayed above the slider.
   - Arcs past the spoiler limit appear locked (see Phase 5).
   - Interleaved filler (e.g., Little East Blue inside Impel Down) sits at its start-episode position on the timeline.
3. **Route generation**
   - Derive the route at runtime from the **currently visible** arcs' `locationIds`, so toggling filler off reconnects canon islands directly (e.g., Loguetown → Reverse Mountain without Warship Island). `route.json` stores hand-authored waypoints keyed by `fromLocationId → toLocationId`, so it needs entries for both the filler and no-filler connections.
   - Filler route segments use a distinct style (e.g., dotted) so they're recognizable on the map.
   - Support optional `waypoints` per segment so the route curves around landmasses and follows the Grand Line instead of cutting straight through the Red Line. Use a smooth curve (Catmull-Rom → Bezier) through waypoints.
   - **Off-ship arcs** (any arc with `offRoute: true`, e.g., Amazon Lily, Impel Down, Marineford, Post-War, Levely, and some filler): don't extend the crew route. Instead, show a dashed side-route or a highlighted location with a short note, and resume the main route at Return to Sabaody. Represent this with an `offRoute: true` flag on the arc.
4. **`RouteLayer.tsx`**
   - Render traveled segments solid, the current segment highlighted, and future segments hidden.
   - Static for now; animation comes in Phase 6.
5. **Ship marker** (`Ship.tsx`): simple original SVG ship icon (generic sailing ship, not a recreation of any canon ship). Placed at the current arc's last location.
6. **URL sync** (`useUrlSync`): `?arc=<arcId>` reads on load and updates on change using `history.replaceState`. Also accept `?ep=<number>`, which resolves to the arc containing that episode (prefer the canon arc when a filler arc overlaps). Invalid values fall back to the first arc. If the URL points to a filler arc while filler is hidden, turn filler on for that session.

**Acceptance criteria**
- Moving the slider updates the route, ship position, and arc name instantly.
- Keyboard navigation works.
- Copying the URL and opening it in a new tab restores the same arc.
- The time-skip and off-ship arcs display sensibly, without a route through the Red Line.
- Toggling filler off removes filler arcs from the timeline and reroutes cleanly between canon islands; toggling it back on restores them.
- `?ep=300` lands on Enies Lobby (or whatever the wiki data says contains episode 300).

---

### Phase 5 — Panels + Spoiler Gate

**Tasks**
1. **`ArcCard.tsx`**: arc name, saga, episode range, an "Anime-only" badge for filler arcs, and the summary. Floats top-left on desktop. Don't show chapter numbers in the UI.
2. **`IslandPanel.tsx`**: opens when an island is clicked. Shows name, region, summary, list of arcs that happen there (clickable to jump), and a "Read more on the wiki" link using `wikiTitle`. Desktop: right-side panel. Mobile: bottom sheet.
3. **`CrewPanel.tsx`**: shows who's aboard at the current arc. Typographic cards with name and role; no character art. New members highlight briefly when they join.
4. **`SpoilerGate.tsx`**
   - First visit: a small, friendly prompt asking "What episode are you on?" with a number input, an arc picker as an alternative, and an "I'm caught up" button. Store the episode number in `localStorage` under a namespaced key, wrapped in try/catch.
   - Arcs that start after the limit episode: locked on the timeline, islands hidden or shown as "?", crew joins after that episode hidden.
   - The arc the viewer is currently in is visible, but show only its name and setup summary, not anything later in it.
   - Changeable any time from the settings menu.
5. **`SettingsMenu.tsx`**: spoiler limit (episode), "Show anime-only arcs" toggle (on by default), reduced motion override, weather effects toggle, sound toggle (off by default), and an About section with the approximate-positions note and credits.
6. **`Footer.tsx`**: credit line linking to the One Piece Fandom wiki (CC-BY-SA), icon credits, "Unofficial fan project" disclaimer, and a link to the GitHub repo.

**Acceptance criteria**
- Clicking any island opens the right panel with correct linked arcs.
- Spoiler gate fully hides content past the limit, including in the URL (a deep link past the limit shows the gate instead).
- Panels work on a 375px-wide screen.

---

### Phase 6 — Animation + Polish

All animation durations and easings live in `config.ts` / `src/animation/`. **Every effect must respect reduced motion** (Section 8).

**Tasks**
1. **Route drawing** (GSAP): when the arc advances, animate the new segment's `stroke-dashoffset` from its length to 0. Going backward un-draws it. Duration scales with segment length, clamped to a min/max.
2. **Ship sailing**: move the ship along the segment path in sync with the route draw, using `getPointAtLength` on the path. Rotate the ship to face its direction of travel. Add a slight idle bob (2–3px loop) when stationary.
3. **Wake trail**: a few small fading dots behind the ship while it's moving.
4. **Camera**: after the route starts drawing, `flyTo` the destination island with a smooth ease. Special slower, more dramatic camera moves for: crossing Reverse Mountain, the descent to Fish-Man Island, and entering the New World.
5. **Rapid scrubbing**: if the user drags the slider quickly, skip intermediate animations and just snap, then animate only the final step. Never queue a backlog of animations.
6. **Ocean** (`OceanEffects.tsx`): an SVG `feTurbulence` + `feDisplacementMap` filter on a wave layer, with its base frequency animating very slowly. Calm Belts get no wave motion. Pause the animation when the tab is hidden.
7. **Island pulse**: the current arc's island(s) pulse softly.
8. **UI motion** (Framer Motion): panels slide in, arc card cross-fades on change, crew cards pop in on join.
9. **Intro sequence** (`Intro.tsx`): ~3.5s. Fog/parchment fade → Red Line and Grand Line draw in → title fades in → map becomes interactive. Skippable by click or keypress. Only shows on first visit (remembered in localStorage). Skipped entirely under reduced motion.
10. **Weather** (tsParticles, lazy-loaded): snow around Drum Island, fog around Thriller Bark, light sparkle in the sky region over Skypiea. Only active near the relevant island at the right zoom. Off when the weather toggle is off.
11. **Sound** (optional, off by default): subtle ambient waves and a soft chime when a crew member joins. Use tiny self-made or CC0 audio files and credit them. Never autoplay.

**Acceptance criteria**
- Stepping through arcs feels smooth at 60fps on a mid-range laptop.
- Fast scrubbing never causes lag or stacked animations.
- With `prefers-reduced-motion: reduce`, there is no route drawing animation, no camera fly (jump instead), no ocean motion, no intro, no particles. Everything still works.

---

### Phase 7 — Content Pass

**Tasks**
1. Write original 1–2 sentence summaries for every arc and every island. Keep them spoiler-light: describe the setup, not the outcome.
2. Proofread all labels and names against the wiki for spelling.
3. Confirm every arc's episode range and the latest aired episode against the wiki. Chapter ranges are optional and can stay empty.
4. Resolve every item on the `TODO-REVIEW` list with the owner.

**Acceptance criteria**
- No empty summaries.
- `data:validate` passes.
- No text copied verbatim from the wiki.

---

### Phase 8 — Accessibility, Performance, Testing

**Accessibility**
- All interactive elements reachable and operable by keyboard with visible focus states.
- Island markers are focusable buttons with accessible names.
- Timeline slider uses proper ARIA slider semantics and announces the current arc.
- Panels trap focus when open on mobile, close on Escape.
- Color contrast meets WCAG AA for text.
- A screen reader user can follow the journey via the timeline and arc card alone.

**Performance**
- Lazy-load tsParticles, audio, and the dev positioner.
- Keep the base SVG optimized (run through SVGO).
- Target Lighthouse scores of 90+ for Performance and Accessibility on desktop.
- Initial JS bundle under ~250KB gzipped, excluding lazy chunks.

**Testing**
- Unit tests: coordinate helper, route derivation with and without filler, episode → arc resolution (including overlapping filler), spoiler filtering by episode, URL parsing, data merge (auto + overrides).
- Component tests: Timeline keyboard navigation, SpoilerGate hiding behavior, IslandPanel arc links.
- One Playwright smoke test: load app, skip intro, step forward three arcs, open an island panel, verify URL updated.
- `data:validate` runs in CI before build.

**Acceptance criteria**
- All tests pass.
- Lighthouse targets met.
- Manual keyboard-only run-through works start to finish.

---

### Phase 9 — Deploy + Portfolio Packaging

**Tasks**
1. GitHub Actions workflow: lint, test, data:validate, build on every push.
2. Deploy to Vercel; confirm deep links like `/?arc=water-7` work.
3. Add Open Graph and Twitter meta tags with an original preview image (a screenshot of our own map, no official art) and a description.
4. Favicon: original simple icon (e.g., compass or generic ship).
5. **README.md** should include:
   - One-paragraph pitch and a link to the live site.
   - A GIF of the timeline in action.
   - Tech stack and why each piece was chosen.
   - Architecture overview: data pipeline → generated JSON → app.
   - The coordinate system decision and the auto-layout + manual override approach.
   - Animation approach and reduced-motion handling.
   - Known limitations (approximate positions, anime-only islands placed by best guess, data current as of the latest episode at build time).
   - Credits and licenses (wiki CC-BY-SA, icons, audio).
   - "Unofficial fan project, not affiliated with Eiichiro Oda, Shueisha, or Toei Animation."
6. Record a 20–30s screen capture GIF for the portfolio site.

**Acceptance criteria**
- Live URL works on desktop and mobile.
- README is complete and reads well to a recruiter who has never seen One Piece.

---

## 8. Reduced Motion Rules

Implement a single `useReducedMotion()` hook that returns true if either the OS setting `prefers-reduced-motion: reduce` is on or the user enabled it in settings. Every animated component checks it. When true:
- Route segments appear instantly.
- Ship jumps to position.
- Camera uses `setView` instead of `flyTo`.
- Ocean filter is static.
- No intro, particles, bobbing, or pulsing.
- Framer Motion transitions use duration 0.

---

## 9. Working Agreements for Claude

- Read this whole file before starting. Re-read the relevant phase before starting it.
- Work one phase at a time. At the end of each phase, stop and give a short summary: what was built, what's left, and any decisions the owner needs to make.
- Commit at logical checkpoints with clear messages (e.g., `feat(map): add CRS.Simple base map`).
- When the wiki data is ambiguous, don't guess silently. Add it to the review list.
- Never fetch, store, or embed official images. If a task seems to require official art, stop and ask.
- Keep components small and readable. Prefer clarity over cleverness; this code will be read by recruiters.
- If something in this plan turns out to be wrong or impractical once you're in the code, say so and propose an alternative rather than forcing it.
- Keep the README updated as features land, not just at the end.

---

## 10. Future Ideas (v2+, not in scope now)

- WebGL ocean shader (PixiJS or Three.js).
- Movies and TV specials as optional side markers.
- Scheduled job that checks the wiki for newly aired episodes and opens a PR updating the data.
- Other crews' routes (e.g., a rival crew) as overlay layers.
- "Bounty over time" mini chart in the crew panel.
- Guided auto-play "tour" mode with narration text.
- Shareable image export of the current map view.
