import Map from './components/Map';
import MapInteraction from './components/MapInteraction';
import Legend from './components/Legend';
import BasemapToggle from './components/BasemapToggle';
import OverlayToggle from './components/OverlayToggle';

import VectorTile from './basemaps/VectorTile';
import Geojson from './overlays/Geojson';
import Highlight from './overlays/Highlight';

export default {
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
        Highlight
    }
};
