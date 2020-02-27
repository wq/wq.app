import { EsriBasemap, EsriTiled, WmsTiled } from './components/basemaps/index';

import { EsriDynamic, EsriFeature, Wms } from './components/overlays/index';

const mapserv = {
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
