import { Map, Legend, BasemapToggle, OverlayToggle } from './components/index';
import { Tile } from './components/basemaps/index';
import { Geojson, Highlight } from './components/overlays/index';
import { LayerGroup as Group } from 'react-leaflet';

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
        Group,
        Empty: Group,
        Tile
    },
    overlays: {
        Group,
        Empty: Group,
        Geojson,
        Highlight
    }
};
