import map from '@wq/map';

import {
    Map,
    MapInteraction,
    Legend,
    BasemapToggle,
    OverlayToggle
} from './components/index';

import { VectorTile, Tile } from './basemaps/index';

import {
    Geojson,
    Highlight,
    Draw,
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
        VectorTile: VectorTileOverlay,
        Tile: TileOverlay
    },
    zoomToLocation
};

export {
    Map,
    MapInteraction,
    Legend,
    BasemapToggle,
    OverlayToggle,
    VectorTile,
    Tile,
    Geojson,
    Highlight,
    Draw,
    VectorTileOverlay,
    TileOverlay
};
