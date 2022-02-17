import map from '@wq/map';

import {
    Map,
    MapInteraction,
    MapAutoZoom,
    MapIdentify,
    Legend,
    BasemapToggle,
    OverlayToggle
} from './components/index';

import { VectorTile, Tile } from './basemaps/index';

import {
    Geojson,
    Highlight,
    Draw,
    Accuracy,
    VectorTile as VectorTileOverlay,
    Tile as TileOverlay
} from './overlays/index';

import { zoomToLocation } from './util';

export default {
    name: 'map-gl',
    dependencies: [map],
    components: {
        Map,
        MapInteraction,
        MapAutoZoom,
        MapIdentify,
        Legend,
        BasemapToggle,
        OverlayToggle
    },
    basemaps: {
        VectorTile,
        Tile
    },
    overlays: {
        Geojson,
        Highlight,
        Draw,
        Accuracy,
        VectorTile: VectorTileOverlay,
        Tile: TileOverlay
    },
    zoomToLocation
};

export {
    Map,
    MapInteraction,
    MapAutoZoom,
    MapIdentify,
    Legend,
    BasemapToggle,
    OverlayToggle,
    VectorTile,
    Tile,
    Geojson,
    Highlight,
    Draw,
    Accuracy,
    VectorTileOverlay,
    TileOverlay
};
