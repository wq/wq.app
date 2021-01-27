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

export default {
    name: 'mapbox',
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
    }
};
