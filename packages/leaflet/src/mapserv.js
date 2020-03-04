import { EsriBasemap, EsriTiled, WmsTiled } from './components/basemaps/index';

import { EsriDynamic, EsriFeature, Wms } from './components/overlays/index';

import leaflet from './index';

const mapserv = {
    name: 'mapserv',
    dependencies: [leaflet],
    basemaps: {
        EsriBasemap,
        EsriTiled,
        WmsTiled
    },
    overlays: {
        EsriTiled,
        EsriDynamic,
        EsriFeature,
        Wms,
        WmsTiled
    }
};

export default mapserv;
