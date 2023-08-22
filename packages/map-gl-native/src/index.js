import map from "@wq/map";

import {
    Map,
    MapProvider,
    MapInteraction,
    MapAutoZoom,
    MapIdentify,
    MapLayers,
    GeoHelpIcon,
} from "./components/index.js";

import { useMapInstance, useGeolocation } from "./hooks.js";

import { VectorTile, Tile } from "./basemaps/index.js";

import {
    Geojson,
    Highlight,
    Draw,
    Accuracy,
    VectorTile as VectorTileOverlay,
    Tile as TileOverlay,
} from "./overlays/index.js";

import { zoomToLocation } from "./util.js";

export default {
    name: "map-gl",
    dependencies: [map],
    components: {
        Map,
        MapProvider,
        useMapInstance,
        MapInteraction,
        MapAutoZoom,
        MapIdentify,
        MapLayers,
        GeoHelpIcon,
        useGeolocation,
    },
    basemaps: {
        VectorTile,
        Tile,
    },
    overlays: {
        Geojson,
        Highlight,
        Draw,
        Accuracy,
        VectorTile: VectorTileOverlay,
        Tile: TileOverlay,
    },
    zoomToLocation,
};

export {
    Map,
    MapInteraction,
    MapAutoZoom,
    MapIdentify,
    MapProvider,
    GeoHelpIcon,
    useMapInstance,
    useGeolocation,
    VectorTile,
    Tile,
    Geojson,
    Highlight,
    Draw,
    Accuracy,
    VectorTileOverlay,
    TileOverlay,
};
