import map from '@wq/map';

import {
    Map,
    MapInteraction,
    Legend,
    BasemapToggle,
    OverlayToggle
} from './components/index';

import { VectorTile } from './components/basemaps/index';

import {
    Geojson,
    Highlight,
    VectorTile as VectorTileOverlay,
    Tile
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
        VectorTile
    },
    overlays: {
        Geojson,
        Highlight,
        VectorTile: VectorTileOverlay,
        Tile
    }
};
