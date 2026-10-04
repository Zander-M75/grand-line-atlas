# Grand Line Atlas

An interactive, animated map of the One Piece world that follows the Straw Hat Pirates' voyage through the anime, arc by arc. A timeline steps through every anime arc in episode order (anime-only arcs included and marked). As it moves, the route draws itself across the sea, the ship sails to the next island, and panels show the arc, the island, and who's aboard. A spoiler gate lets viewers set the episode they're on, so nothing past it is shown.

> **Status:** in development. The base map, the story data pipeline, island placement, the timeline with the crew's route, the arc, island, and crew panels with the spoiler gate, the animation, the writing pass, and the accessibility, performance, and testing pass (Phases 1–8) are in; deployment comes next. See [PLAN.md](PLAN.md) for the full roadmap.

## Running it

Requires Node 22+.

```sh
npm install
npm run dev        # start the dev server
npm test           # unit and component tests (Vitest)
npm run test:e2e   # build, then browser tests (Playwright, desktop and phone)
npm run lint       # ESLint
npm run typecheck  # TypeScript, app, Node, and browser-test configs
npm run build      # validate the data, type-check, then production build
```

The first `test:e2e` run needs a browser for Playwright: `npx playwright install chromium`.

Data scripts:

```sh
npm run data:fetch     # pull wiki text into data/raw (cached, throttled; -- --refresh to re-fetch)
npm run data:build     # parse it into data/generated/*.json (island positions, the route, summaries checked)
npm run data:validate  # schema, integrity, and episode checks; exits non-zero on errors
npm run data:layout    # re-run just the island auto-layout
```

## Tech stack

| Concern            | Choice                               | Why                                                                                          |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Build              | Vite                                 | Fast dev server and a static build                                                           |
| UI                 | React 19 + TypeScript (strict)       | React 19 because react-leaflet 5 requires it                                                 |
| Map                | Leaflet + react-leaflet              | `CRS.Simple` lets us pan and zoom an original pixel-space map instead of a real-world globe |
| UI animation       | Framer Motion (`LazyMotion`)         | Panel and card transitions, loading only the animation features used                        |
| Sequence animation | GSAP                                 | Route drawing, ship movement, intro                                                          |
| Particles          | tsParticles (basic bundle + star)    | Weather around three islands; loaded only when weather shows                                 |
| Sound              | Web Audio API (no library, no files) | The sea and a chime are synthesized as they play                                             |
| State              | Zustand                              | One small store for the current arc, spoiler limit, and settings                            |
| Styling            | CSS Modules + CSS custom properties  | Theme tokens in one file (`src/styles/tokens.css`)                                           |
| Fonts              | Fontsource (self-hosted)             | No third-party font requests; both faces are OFL-licensed                                    |
| Tests              | Vitest + React Testing Library       | Shares Vite's config and module resolution                                                   |
| Browser tests      | Playwright + axe-core                | A first visit end to end in real Chromium, plus an automated accessibility scan of each screen |
| Lint/format        | ESLint (typescript-eslint) + Prettier |                                                                                              |
| Wikitext parsing   | wtf_wikipedia (scripts only)         | Parses the wiki's templates, including nested ones, so scripts don't hand-roll regexes       |
| Data validation    | zod (scripts only)                   | Schemas checked against `src/types.ts` at compile time with `satisfies`                      |

## Project layout

```
src/        the app (map/, ui/, store/, hooks/, animation/, styles/, config.ts, types.ts)
scripts/    Node data pipeline, run with tsx, never shipped to the client
data/       raw/ (cached wiki responses, gitignored), generated/ (committed), overrides/
tests/      Vitest unit and component tests
e2e/        Playwright browser tests, run against the production build
```

`src/config.ts` holds the title, map dimensions, zone boundaries, and animation timings, so layout and timing tweaks never touch component code. The data scripts import it too.

## The map

The world is an original chart, not a real-world map, so Leaflet runs in `CRS.Simple`: plain pixel coordinates on a 4000 × 2000 plane instead of latitude and longitude.

- **One coordinate convention.** Every position in the data and config is in map pixels with the origin at the top-left and y growing down, matching the SVG. Leaflet wants `[y, x]` with y growing up, so a single helper, `toLatLng` in [src/map/coords.ts](src/map/coords.ts), does the flip, and nothing else converts inline.
- **The base map is drawn from config.** [BaseMap.tsx](src/map/BaseMap.tsx) renders the ocean, Calm Belts, Grand Line, Red Line, graticule, compass rose, and labels as inline SVG, positioned from the zone boundaries in `config.ts`, so moving a zone there moves the art. Inline SVG (rather than an `<img>`) stays sharp at every zoom and lets the labels use the app's fonts. The Red Line's ragged cliffs and hachures are generated from a fixed seed, so the map is identical on every load.
- **Zoom fits the screen.** The farthest-out zoom is recomputed on resize to "whole world in view", so the map works from a phone to a wide monitor without letting anyone zoom out into empty space.

- **Islands are placed in two layers.** [scripts/auto-layout.ts](scripts/auto-layout.ts) gives every island a starting spot from the zones in `config.ts`: East Blue islands follow a curve toward Reverse Mountain, Grand Line islands spread out in visit order on alternating sides of the centerline (so neighbors' labels don't collide), and special cases (Mary Geoise on the Red Line, Fish-Man Island beneath it, Skypiea above Jaya, the Calm Belt islands) follow written rules. Hand-placed positions in `data/overrides/positions.json` win over it when the app loads, so re-running the layout never loses hand work.
- **Names appear as you zoom in.** At the full-world view islands are dots, named only while pointed at or focused; names show from zoom −0.5 inward. Anime-only places are violet, Fish-Man Island has an undersea ring, and Skypiea floats.

### Placing islands by hand (dev only)

Run `npm run dev` and press **Shift+D**. Every island becomes draggable, faint outlines show the zones from `config.ts`, and a panel offers **Save to positions.json** (written straight to `data/overrides/positions.json` by the dev server) or **Copy JSON**. Commit the file to keep the positions. Unsaved moves survive a reload. In development, clicking the map also logs its pixel coordinates to the console.

## The timeline and the route

The strip under the map is the timeline: one stop per anime arc in airing order, bracketed by saga. Click or drag to scrub, use the previous/next buttons, or use the keyboard: arrow keys step from anywhere on the page (except on the map, where they pan), Home/End jump to the ends, and Page Up/Down jump a saga at a time when the slider has focus. Hovering a stop previews its name and episodes. Anime-only arcs are hatched in violet, and a switch hides them.

- **The route is derived, not stored.** [src/data/voyage.ts](src/data/voyage.ts) turns whichever arcs are on the timeline into the ship's stops and the legs between them. Hiding anime-only arcs just means passing fewer arcs in, so canon islands reconnect directly (Loguetown sails straight to Reverse Mountain once Warship Island is hidden). Legs that touch an anime-only stop are dotted.
- **Some arcs don't move the ship.** Off-route arcs (Luffy's Summit War arcs, flashbacks, other characters' side stories) highlight where they happen, marked "Away from the ship", while the ship waits at its last stop. The route picks up again when the crew sets sail. Arcs that name no island leave the ship where it is.
- **Luffy's own path is a side route.** Through the Summit War the story follows Luffy alone, so his path (Sabaody to Amazon Lily, Impel Down, Marineford, and Rusukaina) is drawn as a dashed line of its own that draws itself as the timeline moves, while the ship stays moored at Sabaody. It's opt-in per arc (`sideRoute` in the data): drawn for every off-route arc, it would run lines from the ship to flashbacks and other characters' stories.
- **Bends are hand-drawn, everything else is a curve.** The whole voyage is one centripetal Catmull-Rom spline through the islands, converted to SVG Bezier curves ([src/utils/spline.ts](src/utils/spline.ts)), so the route flows through islands instead of zigzagging. A few legs need a bend: East Blue ships climb Reverse Mountain along the Red Line instead of crossing the Calm Belt. Those bends live in [scripts/sources/waypoints.ts](scripts/sources/waypoints.ts), with a reason for each, and `build-route` writes them into `data/generated/route.json` for every leg sailed with anime-only arcs shown or hidden. `data:validate` fails if either set of legs is missing an entry.
- **Drawn in map space.** The route is inline SVG in the base map's own pixel space, so each leg is a single `<path>` that keeps its shape at every zoom. The ship is a small original sailing ship, moored a little way back along the leg it arrived on so it never hides the island.
- **Every view has a link.** The URL tracks the current arc (`?arc=enies-lobby`, updated with `history.replaceState`). Links can also name an episode, `?ep=300`, which opens the arc it belongs to; where an anime-only arc airs inside a canon one, the canon arc wins. A link to an anime-only arc turns them on.
- **The camera follows only when it has to.** On load the map opens on the current arc. After that it flies only when the arc's islands aren't comfortably in view, and it never zooms in on its own (milestones aside; see Animation). It frames everything clear of the floating panels: each panel that covers the map is marked `data-covers-map`, and the camera keeps what it frames out from under them, even showing a little past the map's edge where a panel hides it anyway.

State lives in one small Zustand store ([src/store/index.ts](src/store/index.ts)): the current arc, the spoiler limit, the open island, and settings. The list of visible arcs is a selector over the filler setting, never a second copy.

## Panels and spoilers

- **The logbook** (top-left) is one sheet of chart paper: the atlas title, the current arc (saga, episodes, anime-only and other tags, summary), and the crew. Crew are typographic cards, name over role, with no character art; whoever joins in the current arc is inked and briefly washed in brass. On phones the timeline right under the map names the arc, so the logbook keeps only the title, the arc's summary, and a folded crew line.
- **Islands open a panel** (a card on the right, a bottom sheet on phones): region, summary, the arcs set there as links that jump the timeline, and the island's wiki page. Clicking open sea or pressing Escape closes it, and focus goes back to the island.
- **Settings** (top-right) hold the spoiler limit, the anime-only switch, a reduce-motion override, and the About notes. Settings and the spoiler limit are remembered in `localStorage` (namespaced `gla:`, every access wrapped so a blocked store just means being asked again).
- **The spoiler gate.** A first visit asks for the last episode watched (or an arc, or "I'm caught up") before showing anything past episode 1. The answer becomes a limit, and the rules live in one place, [src/data/spoilers.ts](src/data/spoilers.ts):
  - Arcs that start after the limit are locked: timeline stops with no name, and their sagas go unnamed too. They contribute nothing else: the map is drawn from a "known arcs" list that leaves them out, so their islands, route legs, and crew simply don't exist yet. The chart fills in as you watch.
  - The arc the limit falls inside shows its name and setup only: the map stops at its first island, and crew who join later in it stay hidden.
  - A shared link past the limit opens the gate instead of the arc, and the URL is rewritten to where the viewer actually is, so the address bar doesn't name it either. Raising the limit opens the linked arc.
- **Reduced motion** is one hook, `useReducedMotion`, combining the OS setting and the override. It's also mirrored onto `<html data-motion>`, so the CSS safety net that stills transitions follows the override too.

## Animation

Animation follows one rule set (PLAN.md §7, Phase 6, and §8): everything moves only as much as it helps, and nothing moves with reduced motion.

- **The voyage.** When the timeline moves, [src/animation/voyagePlan.ts](src/animation/voyagePlan.ts) works out what changes: legs newly sailed draw themselves while the ship rides their leading edge, and stepping back rewinds them, the ship backing up along its own wake. Only the last step of a jump animates (the rest is drawn at once), and a change that arrives mid-animation finishes the running one instantly, so scrubbing never builds a backlog. The plan is plain data, so its rules are unit-tested; [src/animation/sail.ts](src/animation/sail.ts) plays it with GSAP.
- **Drawing by cutting, not dashing.** Route strokes are non-scaling and anime-only legs are dotted, both of which fight the usual `stroke-dashoffset` reveal. Instead, each frame rewrites the leg's path to the stretch sailed so far, splitting the last Bezier piece exactly (de Casteljau). A leg mid-draw looks exactly like a finished one, dots included.
- **Sailing at a steady speed.** Bezier curves aren't parameterized by distance, so [src/utils/track.ts](src/utils/track.ts) measures each leg once into a distance table and looks positions up in it. The ship, the wake, and the line's leading edge all read from it, without touching the DOM.
- **The ship** is drawn side-on, so instead of rotating freely it faces east or west and pitches toward its course (up to about 30°), holding its facing on runs due north or south. Moored, it bobs; under way, it drops a fading wake.
- **The camera** flies with Leaflet's `flyTo`. Crossing one of the voyage's thresholds (over Reverse Mountain, down to Fish-Man Island, into the New World) gets a slower flight that moves in close. While the timeline is being scrubbed, the camera waits and moves once when it stops.
- **The ocean** is rows of engraved wave marks warped by an SVG turbulence filter whose frequency drifts over an 18-second swell. Filters are costly to redraw, so it updates at most 20 times a second, pauses while the map moves or the tab is hidden, and leaves the Calm Belts still.
- **Islands** of the current arc pulse softly.
- **The intro** plays once, on a first visit: a parchment fog clears, the Red Line draws pole to pole, the Grand Line sweeps around the world, the title rises, and the camera flies down to the first arc before asking where the viewer is in the story. Any click or key skips it.
- **Panels** slide in from the edge they dock to, the arc card cross-fades, and a new crewmate's card pops in (Framer Motion).
- **Weather** (tsParticles, loaded only when it shows): snow over Drum Island, fog around Thriller Bark, and glitter over Skypiea. Each is a soft-edged patch pinned to its island that runs only while it's on screen and the map is zoomed in enough to see it.
- **Sound**, off by default and never remembered between visits: a low sea wash and a bell when someone joins, synthesized with the Web Audio API, so there are no audio files at all.
- **Reduced motion** (the OS setting, or the switch in Settings): one hook, `useReducedMotion`, that every animated piece checks. Route legs appear whole, the ship jumps, the camera cuts instead of flying, the ocean holds still, and there's no intro, weather, bobbing, or pulsing; Framer Motion transitions become instant. CSS animations are stilled by a global rule keyed to `<html data-motion>`. Animation timings live in `TIMING` in `src/config.ts`; the ones CSS needs are published as custom properties.

Measured in Chrome on an Apple-silicon laptop, sailing and flying hold the display's full 120 Hz (95th-percentile frame 7.7 ms, ocean included). With the CPU throttled 4× in the production build, most steps have no frame over 50 ms; one that starts a camera flight can have one of about 60 ms.

## Accessibility

The goal (PLAN.md §7, Phase 8) is that the whole journey works by keyboard and by screen reader, not just with a mouse.

- **Keyboard.** Everything is reachable with Tab and shows a focus ring: brass on the sea, ink on paper. The first Tab stop is a "Skip to the timeline" link, past the map's islands. Source order is reading order: the title and logbook, settings, the map (each island a button), the timeline, the footer. The timeline is a single ARIA slider (arrows, Home/End, Page Up/Down by saga), and arrow keys step arcs from anywhere outside the map. On the map, arrows pan and plus/minus zoom; an island reached with Tab is panned into view, clear of the panels, and shows its name even when zoomed out. Enter or Space opens it.
- **Screen readers.** The slider's value reads as the arc: "Impel Down Arc, episodes 422 to 456, Summit War Saga, away from the ship". Moving to an arc any other way (the step buttons, the arrow keys elsewhere on the page, an island's arc links) is announced through a status region, along with who comes aboard. Islands are named with their place in the story ("Syrup Village, visited", "Goat Island, ahead, anime-only"), the map is a labeled region with a hint about its keys, and the decorative SVG layers are hidden from assistive tech and kept out of the Tab order.
- **Panels.** The island panel and settings close with Escape and hand focus back to what opened them. On phones, where they cover much of the map, they're modal dialogs: focus moves inside and Tab stays there until they close. The spoiler prompt is always modal.
- **Contrast.** Every text color pair is WCAG AA (4.5:1) on its surface; the pairs are listed in [src/styles/tokens.css](src/styles/tokens.css). Islands still ahead fade their dot but only dim their name, to a tone that still passes. The one exception is the region lettering painted into the chart ("Grand Line", "East Blue"), kept faint like a watermark; WCAG exempts text that's part of a picture.
- **Motion.** Reduced motion turns off every animation (see Animation).

Checked automatically: axe finds no violations on any screen (the spoiler prompt, the map with an island open, settings) at desktop and phone sizes, as part of the browser tests, and Lighthouse scores Accessibility 100.

## Performance and testing

- **Lighthouse** (desktop, production build, first visit with the intro): Performance 97, Accessibility 100, Best Practices 96 (the missing favicon, coming in Phase 9). First and largest contentful paint come in under a second.
- **Bundle.** The initial JavaScript is 201 KB gzipped, under the 250 KB budget: React DOM about a third, Leaflet a quarter, then the app and its data, GSAP, and Framer Motion. tsParticles loads only when weather shows (28 KB gzipped), and the dev positioner never ships. The sound code is about 1 KB and isn't split out, because Safari only lets audio start inside the click that turns it on. Source maps are published, so the production build can be read in devtools.
- **The base map** is generated as inline SVG from `config.ts` with every number rounded: 73 elements, about 29 KB of markup. With no hand-drawn file there's nothing for SVGO to do.
- **Unit and component tests** (Vitest, 177): the coordinate helper, route derivation with and without anime-only arcs, episode-to-arc lookup with interleaved arcs, spoiler filtering, URL parsing, merging hand-placed positions, the voyage animation plan, and components (timeline keyboard use and announcements, the spoiler gate, island panel links, phone dialogs). Arc and journey tests use the real generated data, since early arcs never change.
- **Browser tests** (Playwright, at desktop and phone sizes, against the production build): a first visit end to end (skip the intro, answer the spoiler prompt, sail three arcs, open an island, check the URL), the same by keyboard alone inside a spoiler limit, and the axe scans. They run one at a time: headless Chromium draws the animated map in software, so parallel pages only slow each other down.
- **The data is validated on every build**: `npm run build` runs `data:validate` first, so CI and deploys can't ship data that fails its checks.

## The data

Story data comes from the One Piece Fandom wiki, following the **anime**: arc order, arc boundaries, and spoiler limits all use anime episode numbers, and anime-only (filler) arcs are included and marked.

```
wiki API ──fetch-wiki──▶ data/raw/ (cached) ──build-arcs / build-locations / auto-layout / build-crew / build-route / check-summaries──▶ data/generated/*.json ──validate-data
                                                  ▲
                    scripts/sources/ (curated: which arcs, which places, crew joins, route bends, summaries)
```

- **Fetching is polite.** One request per second, an identifying User-Agent, retries with backoff, and every response cached to disk, so re-running costs nothing. Text only; no images are ever requested.
- **Curated input is separate from facts.** [scripts/sources/journey.ts](scripts/sources/journey.ts) says which arcs to show and which places each visits; [scripts/sources/crew.ts](scripts/sources/crew.ts) holds each Straw Hat's join episode, with the wiki text that backs it. Everything the wiki can answer (episode ranges, sagas, anime-only status, order, regions) is pulled from it, and the build checks the curated files against it.
- **The wiki's episode guide is the main source.** Its saga pages list every arc in airing order with each episode's air date, so the build knows which arcs interleave (Little East Blue airs inside Impel Down) and which episode aired last. Each arc's episode category is a cross-check, episode by episode. Where the wiki's own pages disagree on an episode's arc, the decision and the evidence for it are written down in `EPISODE_ARCS` ([scripts/sources/journey.ts](scripts/sources/journey.ts)): episode 45, Luffy's first bounty, opens Loguetown even though the guide files it under Arlong Park. Specials at the end of an arc stay with it, so every episode belongs somewhere.
- **Summaries are written, not scraped.** Every arc and island has one or two original sentences in [scripts/sources/summaries.ts](scripts/sources/summaries.ts). They're spoiler-light by rule: an arc's summary shows from its first episode (even to a viewer partway through it), so it sets the scene and never gives away the outcome. `check-summaries` compares each one with every cached wiki page and flags any run of six or more shared words, and `data:validate` fails on a missing summary or one longer than two sentences.
- **Judgment calls aren't silent.** Anything ambiguous goes on a TODO-REVIEW list, printed by the build and saved to [data/generated/review/](data/generated/review/).

The data currently runs through episode 1180 (as of 2026-10-04): 51 arcs, 42 places, and the ten Straw Hats.

## Credits and licenses

- Story data comes from the [One Piece Fandom wiki](https://onepiece.fandom.com/), used under [CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/). Arc and island summaries are written originally for this project, and checked against the wiki's text so none repeats it.
- Fonts: [IM Fell English](https://fonts.google.com/specimen/IM+Fell+English) (Igino Marini) and [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) (Braille Institute), both under the SIL Open Font License.
- All map art is original, hand-coded SVG. Island positions are approximate; the series' own geography isn't consistent.
- Sounds are synthesized in the browser; there are no recordings or audio files.
- Libraries: Leaflet (BSD-2-Clause), react-leaflet, Zustand, Framer Motion, and tsParticles (MIT), and GSAP (GreenSock's standard no-charge license). Development only: Playwright (Apache-2.0) and axe-core (MPL-2.0).

Unofficial fan project, not affiliated with Eiichiro Oda, Shueisha, or Toei Animation.
