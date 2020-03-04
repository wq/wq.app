import map from '@wq/map';

import {
    Map,
    MapInteraction,
    Legend,
    BasemapToggle,
    OverlayToggle
} from './components/index';

import { VectorTile, Tile } from './components/basemaps/index';

import {
    Geojson,
    Highlight,
    Draw,
    VectorTile as VectorTileOverlay,
    Tile as TileOverlay
} from './components/overlays/index';

export default {
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
