import map from '@wq/map';
import {
    Map,
    MapAutoZoom,
    Legend,
    BasemapToggle,
    OverlayToggle
} from './components/index';
import { Tile } from './basemaps/index';
import { Geojson, Highlight, Draw, Accuracy } from './overlays/index';
import { LayerGroup as Group } from 'react-leaflet';
import L from 'leaflet';

// import 'leaflet/dist/leaflet.css';

export default {
    name: 'leaflet',
    dependencies: [map],
    config: {
        popups: {},
        icons: {
            default: new L.Icon.Default()
        },
        defaults: {
            // Defaults to simplify creation of new icons of the same dimensions
            // as L.Icon.Default
            icon: {
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            }
        }
    },
    init(config) {
        if (config) {
            this.config = { ...this.config, ...config };
        }
    },
    createIcon(name, options) {
        return (this.config.icons[name] = L.icon({
            ...this.config.defaults.icon,
            ...options
        }));
    },
    components: {
        Map,
        MapAutoZoom,
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
        Draw,
        Accuracy
    },
    zoomToLocation(instance, geometry) {
        if (geometry.type === 'Point') {
            const [longitude, latitude] = geometry.coordinates;
            instance.flyTo([latitude, longitude], 18);
        } else {
            //FIXME
        }
    }
};

export {
    Map,
    Legend,
    BasemapToggle,
    OverlayToggle,
    Tile,
    Geojson,
    Highlight,
    Draw,
    Accuracy
};
