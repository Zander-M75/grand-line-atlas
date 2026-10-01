# Grand Line Atlas

An interactive, animated map of the One Piece world that follows the Straw Hat Pirates' voyage through the anime, arc by arc. A timeline steps through every anime arc in episode order (anime-only arcs included and marked). As it moves, the route draws itself across the sea, the ship sails to the next island, and panels show the arc, the island, and who's aboard. A spoiler gate lets viewers set the episode they're on, so nothing past it is shown.

> **Status:** early development. Phase 0 (project setup) is done; the map comes next. See [PLAN.md](PLAN.md) for the full roadmap.

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

Data scripts (built in Phase 2; they exit with "not implemented" until then):

```sh
npm run data:fetch     # pull wiki text into data/raw (cached, throttled)
npm run data:build     # parse it into data/generated/*.json
npm run data:layout    # assign starting island positions (Phase 3)
npm run data:validate  # schema and integrity checks
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

## Project layout

```
src/        the app (map/, ui/, store/, hooks/, animation/, styles/, config.ts, types.ts)
scripts/    Node data pipeline, run with tsx, never shipped to the client
data/       raw/ (cached wiki responses, gitignored), generated/ (committed), overrides/
public/map/ the original base map SVG
tests/      Vitest unit and component tests
```

`src/config.ts` holds the title, map dimensions, zone boundaries, and animation timings, so layout and timing tweaks never touch component code. The data scripts import it too.

## Credits and licenses

- Story data will come from the [One Piece Fandom wiki](https://onepiece.fandom.com/), used under [CC-BY-SA](https://creativecommons.org/licenses/by-sa/3.0/). Arc and island summaries are written originally for this project.
- Fonts: [IM Fell English](https://fonts.google.com/specimen/IM+Fell+English) (Igino Marini) and [Atkinson Hyperlegible Next](https://www.brailleinstitute.org/freefont/) (Braille Institute), both under the SIL Open Font License.
- All map art is original, hand-coded SVG. Island positions are approximate; the series' own geography isn't consistent.

Unofficial fan project, not affiliated with Eiichiro Oda, Shueisha, or Toei Animation.
