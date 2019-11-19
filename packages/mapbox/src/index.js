import Map from './components/Map';
import Legend from './components/Legend';
import BasemapToggle from './components/BasemapToggle';
import OverlayToggle from './components/OverlayToggle';

import VectorTile from './basemaps/VectorTile';
import Geojson from './overlays/Geojson';
import Highlight from './overlays/Highlight';

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
        Geojson,
        Highlight
    }
};
