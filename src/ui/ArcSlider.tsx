/**
 * The arc slider: one stop per arc, evenly spaced in airing order and grouped into labeled
 * sagas. It's a single ARIA slider, so it takes one Tab stop and the standard keys: arrows
 * step, Home/End jump to the ends, Page Up/Down jump by saga. Click or drag to scrub.
 *
 * Stops past `lastOpen` are locked (past the viewer's spoiler limit) and can't be selected.
 */
import {
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { episodeLabel, episodeText, shortSagaName } from '@/data/arcs';
import type { Arc } from '@/types';
import { cx } from '@/utils/cx';
import styles from './ArcSlider.module.css';

interface ArcSliderProps {
  arcs: Arc[];
  /** Index of the current arc in `arcs`. */
  value: number;
  /** Index of the last arc the viewer may open; later ones are locked. */
  lastOpen: number;
  onChange: (index: number) => void;
}

export function ArcSlider({ arcs, value, lastOpen, onChange }: ArcSliderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const sagas = useMemo(() => sagaRuns(arcs), [arcs]);
  const current = arcs[value];

  const select = (index: number) => {
    const clamped = Math.min(Math.max(index, 0), lastOpen);
    if (clamped !== value) onChange(clamped);
  };

  /** The stop under a pointer: each arc owns an equal-width column. */
  const indexAt = (clientX: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return value;
    const index = Math.floor(((clientX - rect.left) / rect.width) * arcs.length);
    return Math.min(Math.max(index, 0), arcs.length - 1);
  };

  function onKeyDown(event: KeyboardEvent) {
    const target = keyTarget(event.key, value, lastOpen, sagas);
    if (target === undefined) return;
    event.preventDefault();
    select(target);
  }

  function onPointerDown(event: PointerEvent) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
    select(indexAt(event.clientX));
  }

  function onPointerMove(event: PointerEvent) {
    const index = indexAt(event.clientX);
    if (dragging) select(index);
    else if (event.pointerType === 'mouse') setHovered(index);
  }

  const endDrag = () => setDragging(false);

  // A preview of the arc under the pointer (or finger, while dragging). The header above
  // already names the current arc, so keyboard focus doesn't need one.
  const tip = dragging ? value : hovered;

  return (
    <div
      ref={ref}
      className={styles.slider}
      style={{ '--count': arcs.length, '--value': value } as CSSProperties}
      role="slider"
      tabIndex={0}
      aria-label="Story arc"
      aria-valuemin={1}
      aria-valuemax={arcs.length}
      aria-valuenow={value + 1}
      aria-valuetext={current && valueText(current)}
      onKeyDown={onKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onPointerLeave={() => setHovered(null)}
    >
      <div className={styles.sagas} aria-hidden="true">
        {sagas.map((run) => (
          <span
            key={run.start}
            className={cx(
              styles.saga,
              value >= run.start && value <= run.end && styles.currentSaga,
              // Named from its right edge near the slider's end, so it can't run off it.
              run.start / arcs.length > 0.8 && styles.sagaOnRight,
            )}
            style={{ gridColumn: `${run.start + 1} / ${run.end + 2}` }}
          >
            <span className={styles.sagaName}>{shortSagaName(run.saga)}</span>
          </span>
        ))}
      </div>

      <div className={styles.track} aria-hidden="true">
        {arcs.map((arc, i) => (
          <span
            key={arc.id}
            className={cx(
              styles.stop,
              arc.filler && styles.filler,
              i < value && styles.passed,
              i > lastOpen && styles.locked,
            )}
          />
        ))}
        <span className={styles.thumb} />
      </div>

      {tip !== null && arcs[tip] && (
        <StopTooltip arc={arcs[tip]} index={tip} count={arcs.length} locked={tip > lastOpen} />
      )}
    </div>
  );
}

function StopTooltip({
  arc,
  index,
  count,
  locked,
}: {
  arc: Arc;
  index: number;
  count: number;
  locked: boolean;
}) {
  // Near the ends, pin the tooltip's edge to the stop instead of centering it, so it stays
  // on screen.
  const fraction = (index + 0.5) / count;
  const pin = fraction < 0.15 ? styles.pinStart : fraction > 0.85 ? styles.pinEnd : undefined;

  return (
    <div
      className={cx(styles.tooltip, pin)}
      style={{ '--at': index } as CSSProperties}
      aria-hidden="true"
    >
      <span className={styles.tooltipName}>{locked ? 'Locked arc' : arc.name}</span>
      <span className={styles.tooltipDetails}>
        {episodeLabel(arc)}
        {arc.filler && <span className={styles.tooltipTag}>Anime-only</span>}
      </span>
    </div>
  );
}

/** What screen readers announce: "Enies Lobby Arc, episodes 264 to 312, Water 7 Saga". */
function valueText(arc: Arc): string {
  return [arc.name, episodeText(arc), arc.saga, arc.filler && 'anime-only']
    .filter(Boolean)
    .join(', ');
}

interface SagaRun {
  saga: string;
  /** Index of the saga's first and last arc on the slider. */
  start: number;
  end: number;
}

/** Consecutive arcs that share a saga. */
function sagaRuns(arcs: Arc[]): SagaRun[] {
  const runs: SagaRun[] = [];
  arcs.forEach((arc, i) => {
    const last = runs.at(-1);
    if (last && last.saga === arc.saga) last.end = i;
    else runs.push({ saga: arc.saga, start: i, end: i });
  });
  return runs;
}

/** Where a key moves the slider, following the ARIA slider pattern. */
function keyTarget(
  key: string,
  value: number,
  lastOpen: number,
  sagas: SagaRun[],
): number | undefined {
  const saga = sagas.findIndex((run) => value >= run.start && value <= run.end);
  const sagaStart = sagas[saga]?.start ?? 0;
  switch (key) {
    case 'ArrowLeft':
    case 'ArrowDown':
      return value - 1;
    case 'ArrowRight':
    case 'ArrowUp':
      return value + 1;
    case 'Home':
      return 0;
    case 'End':
      return lastOpen;
    case 'PageUp': // the next saga
      return sagas[saga + 1]?.start ?? lastOpen;
    case 'PageDown': // back to this saga's start, or the previous saga if already there
      return value > sagaStart ? sagaStart : (sagas[saga - 1]?.start ?? 0);
    default:
      return undefined;
  }
}
