import type { Arc } from '@/types';
import { Tag } from './Tag';

/** Short notes on what kind of arc this is, and why the ship might not move. */
export function ArcTags({ arc }: { arc: Arc }) {
  return (
    <>
      {arc.filler && <Tag filler>Anime-only</Tag>}
      {arc.ongoing && <Tag>Now airing</Tag>}
      {arc.offRoute ? (
        <Tag>Away from the ship</Tag>
      ) : (
        arc.locationIds.length === 0 && <Tag>No island stop</Tag>
      )}
    </>
  );
}
