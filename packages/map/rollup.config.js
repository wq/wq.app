import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banners = {
    map: makeBanner(pkg, 2013),
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
    // ESM
    {
        input: 'packages/map/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['leaflet', 'esri-leaflet', 'leaflet.wms'],
        output: [
            {
                banner: banners.map,
                file: 'packages/map/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/map/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['leaflet', 'esri-leaflet', 'leaflet.wms'],
        output: [
            {
                banner: banners.map,
                file: 'packages/map/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/map/src/map.js',
        plugins: [wqDeps('.'), babelAMD()],
        external: ['leaflet'],
        output: outputAMD('map', banners.map)
    },
    {
        input: 'packages/map/src/locate.js',
        external: ['leaflet'],
        plugins: [babelAMD()],
        output: outputAMD('locate', banners.locate, 'map')
    },
    {
        input: 'packages/map/src/mapserv.js',
        external: ['leaflet', 'esri-leaflet', 'leaflet.wms', './map'],
        plugins: [babelAMD()],
        output: outputAMD('mapserv', banners.mapserv, 'map')
    }
];
