import { Map, Legend, BasemapToggle, OverlayToggle } from './components/index';
import { Tile } from './basemaps/index';
import { Geojson } from './overlays/index';

// import 'leaflet/dist/leaflet.css';

export default {
    name: 'leaflet',
    components: {
        Map,
        Legend,
        BasemapToggle,
        OverlayToggle
    },
    basemaps: {
        Tile
    },
    overlays: {
        Geojson
    }
};
