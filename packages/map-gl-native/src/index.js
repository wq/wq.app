import map from "@wq/map";

import {
    Map,
    MapInteraction,
    MapAutoZoom,
    MapIdentify,
    MapLayers,
} from "./components/index.js";

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
        MapInteraction,
        MapAutoZoom,
        MapIdentify,
        MapLayers,
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
    VectorTile,
    Tile,
    Geojson,
    Highlight,
    Draw,
    Accuracy,
    VectorTileOverlay,
    TileOverlay,
};
