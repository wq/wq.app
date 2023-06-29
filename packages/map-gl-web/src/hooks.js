import { useMap } from "react-map-gl";
import { usePluginState } from "@wq/react";

export function useMapInstance(mapId) {
    const maps = useMap(),
        mapState = usePluginState("map");

    if (mapState && !mapId) {
        mapId = mapState.mapId;
    }

    return (mapId && maps[mapId]) || maps.current || maps.default;
}
