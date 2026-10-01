import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { ZOOM } from '@/config';

/**
 * Turns island names on from ZOOM.labels inward (or always, with `alwaysOn`) by flagging
 * the map container; CSS hides the labels when it's off. No marker re-renders on zoom.
 */
export function useZoomLabels({ alwaysOn = false } = {}) {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const update = () => {
      container.dataset.labels = alwaysOn || map.getZoom() >= ZOOM.labels ? 'on' : 'off';
    };
    update();
    map.on('zoomend', update);
    return () => {
      map.off('zoomend', update);
    };
  }, [map, alwaysOn]);
}
