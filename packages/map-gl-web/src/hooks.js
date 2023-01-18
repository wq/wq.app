import { useMap } from "react-map-gl";

export function useMapInstance(mapId) {
    const maps = useMap();
    return mapId ? maps[mapId] : maps.current;
}
