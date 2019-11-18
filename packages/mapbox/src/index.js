import Map from './components/Map';
import Legend from './components/Legend';
import BasemapToggle from './components/BasemapToggle';
import OverlayToggle from './components/OverlayToggle';

import VectorTile from './basemaps/VectorTile';
import Geojson from './overlays/Geojson';

export default {
    components: {
        Map,
        Legend,
        BasemapToggle,
        OverlayToggle
    },
    basemaps: {
        VectorTile
    },
    overlays: {
        Geojson
    }
};
