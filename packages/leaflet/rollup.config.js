import pkg from './package.json';
import { makeBanner, wqDeps, babelAMD, outputAMD } from '../../rollup-utils.js';
const banners = {
    leaflet: makeBanner(pkg, 2013),
    locate: makeBanner(
        {
            name: pkg.name + '/locate',
            description: "Geolocation utilities via Leaflet's Map.locate",
            version: pkg.version
        },
        2013
    ),
    mapserv: makeBanner(
        {
            name: pkg.name + '/mapserv',
            description:
                'Extension to wq/map.js with support for WMS and ESRI services',
            version: pkg.version
        },
        2016
    )
};

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/leaflet/src/index.js',
        plugins: [wqDeps('.'), babelAMD({ jsx: true })],
        external: ['react', 'leaflet'],
        output: outputAMD('leaflet', banners.leaflet)
    },
    {
        input: 'packages/leaflet/src/locate.js',
        external: ['react', 'leaflet'],
        plugins: [babelAMD({ jsx: true })],
        output: outputAMD('locate', banners.locate, 'leaflet')
    },
    {
        input: 'packages/leaflet/src/mapserv.js',
        external: ['react', 'leaflet', 'esri-leaflet', 'leaflet.wms'],
        plugins: [babelAMD({ jsx: true })],
        output: outputAMD('mapserv', banners.mapserv, 'leaflet')
    }
];
