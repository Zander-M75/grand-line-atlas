/**
 * Dev-only tool for placing islands by hand (Shift+D toggles it). Drag any island; Save
 * writes data/overrides/positions.json through the dev server, or Copy puts the JSON on the
 * clipboard. Saved positions override the auto layout whenever the app loads.
 *
 * Unsaved moves are kept in localStorage, so a reload doesn't lose them.
 */
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleMarker, Rectangle } from 'react-leaflet';
import { BANDS, BLUE_QUADRANTS, MAP_HEIGHT, MAP_WIDTH, ZONES, type Quadrant } from '@/config';
import type { PositionOverrides } from '@/data/positions';
import { useZoomLabels } from '@/hooks/useZoomLabels';
import type { Location } from '@/types';
import savedFile from '../../data/overrides/positions.json';
import { toLatLng, type MapPoint } from './coords';
import { IslandMarker } from './IslandMarker';
import styles from './DevPositioner.module.css';

const DRAFT_KEY = 'gla:dev-positions-draft';

export default function DevPositioner({ locations }: { locations: Location[] }) {
  useZoomLabels({ alwaysOn: true });
  const [saved, setSaved] = useState<PositionOverrides>(savedFile);
  const [draft, setDraft] = useState<PositionOverrides>(readDraft);
  const [status, setStatus] = useState('');

  useEffect(() => writeDraft(draft), [draft]);

  const overrides = sortById({ ...saved, ...draft });
  const unsaved = Object.keys(draft).filter((id) => !samePoint(draft[id], saved[id]));

  const move = (id: string, { x, y }: MapPoint) => {
    setDraft((current) => ({ ...current, [id]: { x: Math.round(x), y: Math.round(y) } }));
    setStatus('');
  };

  async function save() {
    const response = await fetch('/__dev/positions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(overrides),
    });
    if (response.ok) {
      setSaved(overrides);
      setDraft({});
      setStatus('Saved to data/overrides/positions.json. Commit it to keep these positions.');
    } else {
      setStatus(`Couldn't save: ${await response.text()}`);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(JSON.stringify(overrides, null, 2) + '\n');
    setStatus('Copied. Paste it into data/overrides/positions.json.');
  }

  return (
    <>
      <ZoneOverlay />
      {locations.map((location) => (
        <IslandMarker
          key={location.id}
          location={{ ...location, ...overrides[location.id] }}
          onMove={(point) => move(location.id, point)}
        />
      ))}
      {createPortal(
        <aside className={styles.panel} aria-label="Island positioner">
          <h2 className={styles.heading}>Island positions</h2>
          <p className={styles.count}>
            {unsaved.length
              ? `${unsaved.length} unsaved move${unsaved.length === 1 ? '' : 's'}`
              : 'No unsaved moves'}
            {' · '}
            {Object.keys(saved).length} placed by hand
          </p>
          <div className={styles.actions}>
            <button type="button" onClick={() => void save()} disabled={!unsaved.length}>
              Save to positions.json
            </button>
            <button type="button" onClick={() => void copy()}>
              Copy JSON
            </button>
            <button type="button" onClick={() => setDraft({})} disabled={!unsaved.length}>
              Discard moves
            </button>
          </div>
          <p className={styles.status} role="status">
            {status}
          </p>
          <ul className={styles.legend}>
            <li className={styles.legendGrandLine}>Grand Line</li>
            <li className={styles.legendCalmBelt}>Calm Belts</li>
            <li className={styles.legendRedLine}>Red Line</li>
            <li className={styles.legendBlue}>The four Blues</li>
          </ul>
          <p className={styles.hint}>Drag an island to move it. Shift+D closes this tool.</p>
        </aside>,
        document.body,
      )}
    </>
  );
}

/** Faint outlines of the zones in src/config.ts, as a placement guide. */
function ZoneOverlay() {
  const box = (left: number, top: number, right: number, bottom: number) =>
    [toLatLng(left, top), toLatLng(right, bottom)] as [[number, number], [number, number]];
  const quadrants: Record<Quadrant, [number, number, number, number]> = {
    nw: [BANDS.paradise.left, 0, BANDS.redLine.left, BANDS.northCalmBelt.top],
    ne: [BANDS.redLine.right, 0, BANDS.newWorld.right, BANDS.northCalmBelt.top],
    sw: [BANDS.paradise.left, BANDS.southCalmBelt.bottom, BANDS.redLine.left, MAP_HEIGHT],
    se: [BANDS.redLine.right, BANDS.southCalmBelt.bottom, BANDS.newWorld.right, MAP_HEIGHT],
  };
  const zone = (className: string | undefined) => ({ className, interactive: false });

  return (
    <>
      <Rectangle
        bounds={box(0, BANDS.grandLine.top, MAP_WIDTH, BANDS.grandLine.bottom)}
        pathOptions={zone(styles.zoneGrandLine)}
      />
      {[BANDS.northCalmBelt, BANDS.southCalmBelt].map((belt) => (
        <Rectangle
          key={belt.top}
          bounds={box(0, belt.top, MAP_WIDTH, belt.bottom)}
          pathOptions={zone(styles.zoneCalmBelt)}
        />
      ))}
      <Rectangle
        bounds={box(BANDS.redLine.left, 0, BANDS.redLine.right, MAP_HEIGHT)}
        pathOptions={zone(styles.zoneRedLine)}
      />
      {Object.values(BLUE_QUADRANTS).map((quadrant) => (
        <Rectangle
          key={quadrant}
          bounds={box(...quadrants[quadrant])}
          pathOptions={zone(styles.zoneBlue)}
        />
      ))}
      <CircleMarker
        center={toLatLng(ZONES.reverseMountain.x, ZONES.reverseMountain.y)}
        radius={14}
        pathOptions={zone(styles.zoneRedLine)}
      />
    </>
  );
}

function samePoint(a?: MapPoint, b?: MapPoint): boolean {
  return Boolean(a && b && a.x === b.x && a.y === b.y);
}

function sortById(positions: PositionOverrides): PositionOverrides {
  return Object.fromEntries(Object.entries(positions).sort(([a], [b]) => a.localeCompare(b)));
}

function readDraft(): PositionOverrides {
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as PositionOverrides;
  } catch {
    return {};
  }
}

function writeDraft(draft: PositionOverrides) {
  try {
    if (Object.keys(draft).length) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else localStorage.removeItem(DRAFT_KEY);
  } catch {
    // Storage unavailable (private mode): moves just won't survive a reload.
  }
}
