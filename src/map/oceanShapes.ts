/**
 * The ocean's wave marks: small double crests scattered over open water, the way old charts
 * letter the sea. They stay out of the Calm Belts (still water), off the Red Line, clear of
 * and clear of the chart border. They don't make room for islands: gaps there would hint at
 * where islands past the viewer's spoiler limit sit. They're faint enough to sit under markers.
 *
 * Placement is seeded, so the sea looks the same on every load.
 */
import { BANDS, MAP_HEIGHT, MAP_WIDTH, ZONES } from '@/config';
import { seededRandom } from '@/utils/random';

const SPACING = 115;
const JITTER = 0.7;
/** Clearances, in map pixels. */
const CLEAR = { border: 50, calmBelt: 18, redLine: 45 };

/** A wave mark: two shallow crests, 28 map pixels wide, starting at (x, y). */
const crest = (x: number, y: number) => `M${x} ${y}q7 -5 14 0t14 0`;

export function wavePath(): string {
  const random = seededRandom(1580);
  const marks: string[] = [];
  for (let row = 0; row * SPACING < MAP_HEIGHT; row++) {
    for (let col = 0; col * SPACING < MAP_WIDTH; col++) {
      // Every other row shifts by half a step, so marks don't line up in columns.
      const x = (col + (row % 2) / 2 + (random() - 0.5) * JITTER) * SPACING;
      const y = (row + 0.5 + (random() - 0.5) * JITTER) * SPACING;
      if (isOpenWater(x, y)) marks.push(crest(Math.round(x), Math.round(y)));
    }
  }
  return marks.join('');
}

function isOpenWater(x: number, y: number): boolean {
  const width = 28;
  const inBand = (top: number, bottom: number, margin: number) =>
    y > top - margin && y < bottom + margin;
  const acrossX = (left: number, right: number, margin: number) =>
    x + width > left - margin && x < right + margin;

  if (x < CLEAR.border || x + width > MAP_WIDTH - CLEAR.border) return false;
  if (y < CLEAR.border || y > MAP_HEIGHT - CLEAR.border) return false;
  if (inBand(BANDS.northCalmBelt.top, BANDS.northCalmBelt.bottom, CLEAR.calmBelt)) return false;
  if (inBand(BANDS.southCalmBelt.top, BANDS.southCalmBelt.bottom, CLEAR.calmBelt)) return false;
  if (acrossX(BANDS.redLine.left, BANDS.redLine.right, CLEAR.redLine)) return false;
  if (acrossX(0, ZONES.redLineEdge.width, CLEAR.redLine)) return false;
  return !acrossX(MAP_WIDTH - ZONES.redLineEdge.width, MAP_WIDTH, CLEAR.redLine);
}
