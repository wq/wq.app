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
    zoomToLocation(instance, geometry) {
        if (geometry.type == 'Point') {
            instance.flyTo({
                center: geometry.coordinates,
                zoom: 18
            });
        } else {
            // FIXME
        }
    }
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
