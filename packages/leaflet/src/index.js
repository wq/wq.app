import map from '@wq/map';
import { Map, Legend, BasemapToggle, OverlayToggle } from './components/index';
import { Tile } from './components/basemaps/index';
import { Geojson, Highlight, Draw } from './components/overlays/index';
import { LayerGroup as Group } from 'react-leaflet';

// import 'leaflet/dist/leaflet.css';

export default {
    name: 'leaflet',
    dependencies: [map],
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
        Highlight,
        Draw
    }
};
