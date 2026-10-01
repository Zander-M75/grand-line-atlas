# Grand Line Atlas

An interactive, animated map of the One Piece world that follows the Straw Hat Pirates' voyage through the anime, arc by arc. A timeline steps through every anime arc in episode order (anime-only arcs included and marked). As it moves, the route draws itself across the sea, the ship sails to the next island, and panels show the arc, the island, and who's aboard. A spoiler gate lets viewers set the episode they're on, so nothing past it is shown.

> **Status:** early development. The base map, the story data pipeline, and island placement are in (Phases 1–3); the timeline and route come next. See [PLAN.md](PLAN.md) for the full roadmap.

## Running it

Requires Node 22+.

```sh
npm install
npm run dev        # start the dev server
npm test           # unit and component tests (Vitest)
npm run lint       # ESLint
npm run typecheck  # TypeScript, app and Node configs
npm run build      # type-check, then production build
```

Data scripts:

```sh
npm run data:fetch     # pull wiki text into data/raw (cached, throttled; -- --refresh to re-fetch)
npm run data:build     # parse it into data/generated/*.json, including island positions
npm run data:validate  # schema, integrity, and episode checks; exits non-zero on errors
npm run data:layout    # re-run just the island auto-layout
```

## Tech stack

| Concern            | Choice                               | Why                                                                                          |
| ------------------ | ------------------------------------ | -------------------------------------------------------------------------------------------- |
| Build              | Vite                                 | Fast dev server and a static build                                                           |
| UI                 | React 19 + TypeScript (strict)       | React 19 because react-leaflet 5 requires it                                                 |
| Map                | Leaflet + react-leaflet              | `CRS.Simple` lets us pan and zoom an original pixel-space map instead of a real-world globe |
| UI animation       | Framer Motion                        | Panel and card transitions                                                                   |
| Sequence animation | GSAP                                 | Route drawing, ship movement, intro                                                          |
| State              | Zustand                              | One small store for the current arc, spoiler limit, and settings                            |
| Styling            | CSS Modules + CSS custom properties  | Theme tokens in one file (`src/styles/tokens.css`)                                           |
| Fonts              | Fontsource (self-hosted)             | No third-party font requests; both faces are OFL-licensed                                    |
| Tests              | Vitest + React Testing Library       | Shares Vite's config and module resolution                                                   |
| Lint/format        | ESLint (typescript-eslint) + Prettier |                                                                                              |
| Wikitext parsing   | wtf_wikipedia (scripts only)         | Parses the wiki's templates, including nested ones, so scripts don't hand-roll regexes       |
| Data validation    | zod (scripts only)                   | Schemas checked against `src/types.ts` at compile time with `satisfies`                      |

## Project layout

```
src/        the app (map/, ui/, store/, hooks/, animation/, styles/, config.ts, types.ts)
scripts/    Node data pipeline, run with tsx, never shipped to the client
data/       raw/ (cached wiki responses, gitignored), generated/ (committed), overrides/
tests/      Vitest unit and component tests
```

`src/config.ts` holds the title, map dimensions, zone boundaries, and animation timings, so layout and timing tweaks never touch component code. The data scripts import it too.

## The map

The world is an original chart, not a real-world map, so Leaflet runs in `CRS.Simple`: plain pixel coordinates on a 4000 × 2000 plane instead of latitude and longitude.

- **One coordinate convention.** Every position in the data and config is in map pixels with the origin at the top-left and y growing down, matching the SVG. Leaflet wants `[y, x]` with y growing up, so a single helper, `toLatLng` in [src/map/coords.ts](src/map/coords.ts), does the flip, and nothing else converts inline.
- **The base map is drawn from config.** [BaseMap.tsx](src/map/BaseMap.tsx) renders the ocean, Calm Belts, Grand Line, Red Line, graticule, compass rose, and labels as inline SVG, positioned from the zone boundaries in `config.ts`, so moving a zone there moves the art. Inline SVG (rather than an `<img>`) stays sharp at every zoom and lets the labels use the app's fonts. The Red Line's ragged cliffs and hachures are generated from a fixed seed, so the map is identical on every load.
- **Zoom fits the screen.** The farthest-out zoom is recomputed on resize to "whole world in view", so the map works from a phone to a wide monitor without letting anyone zoom out into empty space.

- **Islands are placed in two layers.** [scripts/auto-layout.ts](scripts/auto-layout.ts) gives every island a starting spot from the zones in `config.ts`: East Blue islands follow a curve toward Reverse Mountain, Grand Line islands spread out in visit order on alternating sides of the centerline (so neighbors' labels don't collide), and special cases (Mary Geoise on the Red Line, Fish-Man Island beneath it, Skypiea above Jaya, the Calm Belt islands) follow written rules. Hand-placed positions in `data/overrides/positions.json` win over it when the app loads, so re-running the layout never loses hand work.
- **Names appear as you zoom in.** At the full-world view islands are dots; names show from zoom −0.5 inward. Anime-only places are violet, Fish-Man Island has an undersea ring, and Skypiea floats.

### Placing islands by hand (dev only)

Run `npm run dev` and press **Shift+D**. Every island becomes draggable, faint outlines show the zones from `config.ts`, and a panel offers **Save to positions.json** (written straight to `data/overrides/positions.json` by the dev server) or **Copy JSON**. Commit the file to keep the positions. Unsaved moves survive a reload. In development, clicking the map also logs its pixel coordinates to the console.

## The data

Story data comes from the One Piece Fandom wiki, following the **anime**: arc order, arc boundaries, and spoiler limits all use anime episode numbers, and anime-only (filler) arcs are included and marked.

```
wiki API ──fetch-wiki──▶ data/raw/ (cached) ──build-arcs / build-locations / build-crew──▶ data/generated/*.json ──validate-data
                                                  ▲
                              scripts/sources/ (curated: which arcs, which places, crew joins)
```

- **Fetching is polite.** One request per second, an identifying User-Agent, retries with backoff, and every response cached to disk, so re-running costs nothing. Text only; no images are ever requested.
- **Curated input is separate from facts.** [scripts/sources/journey.ts](scripts/sources/journey.ts) says which arcs to show and which places each visits; [scripts/sources/crew.ts](scripts/sources/crew.ts) holds each Straw Hat's join episode, with the wiki text that backs it. Everything the wiki can answer (episode ranges, sagas, anime-only status, order, regions) is pulled from it, and the build checks the curated files against it.
- **The wiki's episode guide is the main source.** Its saga pages list every arc in airing order with each episode's air date, so the build knows which arcs interleave (Little East Blue airs inside Impel Down) and which episode aired last. Each arc's episode category is used as a cross-check.
- **Judgment calls aren't silent.** Anything ambiguous goes on a TODO-REVIEW list, printed by the build and saved to [data/generated/review/](data/generated/review/).

The data currently runs through episode 1180 (as of 2026-10-01): 51 arcs, 42 places, and the ten Straw Hats.

## Credits and licenses

- Story data comes from the [One Piece Fandom wiki](https://onepiece.fandom.com/), used under [CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/). Arc and island summaries are written originally for this project.
- Fonts: [IM Fell English](https://fonts.google.com/specimen/IM+Fell+English) (Igino Marini) and [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) (Braille Institute), both under the SIL Open Font License.
- All map art is original, hand-coded SVG. Island positions are approximate; the series' own geography isn't consistent.

Unofficial fan project, not affiliated with Eiichiro Oda, Shueisha, or Toei Animation.
