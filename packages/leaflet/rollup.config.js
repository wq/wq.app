import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
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
    // ESM
    {
        input: 'packages/leaflet/index.js',
        plugins: [wqDeps('@wq'), babelNPM({ jsx: true })],
        external: [
            'react',
            'prop-types',
            'react-leaflet',
            'leaflet',
            'esri-leaflet',
            'leaflet.wms'
        ],
        output: [
            {
                banner: banners.leaflet,
                file: 'packages/leaflet/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/leaflet/index.js',
        plugins: [wqDeps('@wq'), babelNPM({ jsx: true })],
        external: [
            'react',
            'prop-types',
            'react-leaflet',
            'leaflet',
            'esri-leaflet',
            'leaflet.wms'
        ],
        output: [
            {
                banner: banners.map,
                file: 'packages/leaflet/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/leaflet/src/index.js',
        plugins: [wqDeps('.'), babelAMD({ jsx: true })],
        external: ['react', 'leaflet'],
        output: outputAMD('leaflet', banners.map)
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
