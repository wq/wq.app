import { EsriBasemap, EsriTiled, WmsTiled } from './basemaps/index';

import { EsriDynamic, EsriFeature, Wms } from './overlays/index';

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
