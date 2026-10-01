import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import { MAP_BOUNDS } from './coords';

/**
 * Sets the farthest-out zoom to "whole map in view" for the current screen size, so
 * viewers can always see the entire world but never zoom out into empty space.
 */
export function FitWorldZoom() {
  const map = useMap();

  useEffect(() => {
    const fitWholeMap = () => map.setMinZoom(map.getBoundsZoom(MAP_BOUNDS));
    fitWholeMap();
    map.on('resize', fitWholeMap);
    return () => {
      map.off('resize', fitWholeMap);
    };
  }, [map]);

  return null;
}
