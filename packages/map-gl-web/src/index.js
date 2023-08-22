import map from "@wq/map";

import {
    Map,
    MapProvider,
    MapInteraction,
    MapAutoZoom,
    MapIdentify,
    MapLayers,
    GeoHelpIcon,
    HighlightPopup,
} from "./components/index.js";

import { useMapInstance } from "./hooks.js";

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
    setEngine(engine) {
        this.engine = engine;
        if (engine.prewarm && typeof Worker !== "undefined") {
            engine.prewarm();
        }
    },
    components: {
        Map,
        MapProvider,
        useMapInstance,
        MapInteraction,
        MapAutoZoom,
        MapIdentify,
        MapLayers,
        GeoHelpIcon,
        HighlightPopup,
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
    useMapInstance,
    GeoHelpIcon,
    HighlightPopup,
    VectorTile,
    Tile,
    Geojson,
    Highlight,
    Draw,
    Accuracy,
    VectorTileOverlay,
    TileOverlay,
};
