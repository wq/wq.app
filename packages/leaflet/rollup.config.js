import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import json from '@rollup/plugin-json';
import * as path from 'path';
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
    },
    deps = {
        '@wq/map': './packages/map/src/index.js',
        '@wq/react': './packages/react/src/index.js',
        'redux-orm/src/index.js': { id: 'redux-orm', external: true }
    };
function resolveId(id) {
    if (id.startsWith('default-from:')) {
        return id;
    }
    return deps[id];
}

function load(id) {
    if (id.startsWith('default-from:')) {
        const file = path.resolve(id.split(':')[1]);
        return `import mod from '${file}'; export default mod`;
    }
    if (id.endsWith('geotools/index.js')) {
        return ['GeoHelp', 'GeoLocate', 'GeoCode', 'GeoCoords']
            .map(emptyComponent)
            .join('\n');
    } else if (
        id.endsWith('GeoTools.js') ||
        id.endsWith('StickyMap.js') ||
        id.endsWith('OffscreenMaps.js')
    ) {
        return emptyComponent();
    }
}
function emptyComponent(name) {
    const exp = name ? 'export' : 'export default';
    return `${exp} function ${name || 'Empty'}() { return null; }`;
}

const replaceConf = {
    'process.env.NODE_ENV': '"production"',

    // Fix reselect import (remove when redux-orm updates to 4.x)
    "from 'reselect'": "from 'reselect/es/index'",
    'from "reselect"': "from 'reselect/es/index'",

    // Leaflet plugins
    "import Draw from 'leaflet-draw": "import * as Draw from 'leaflet-draw",
    "from 'react-leaflet-markercluster'":
        "from 'react-leaflet-markercluster/src/react-leaflet-markercluster'",
    "require('leaflet.markercluster')": "import 'leaflet.markercluster'",

    // rudy-history
    'exports.default = createBrowserHistory;':
        'export default createBrowserHistory;',
    'exports.default = createMemoryHistory;':
        'export default createMemoryHistory;',

    // react-fast-compare
    'module.exports = function exportedEqual':
        'export default function exportedEqual',

    // fast-deep-equal
    'module.exports = function equal': 'export default function equal',

    delimiters: ['', '']
};

export default [
    // AMD (for wq.app Python package)
    {
        input: 'default-from:packages/leaflet/src/index.js',
        external: [
            'leaflet',
            'leaflet.markercluster',
            'mustache',
            'react',
            'react-dom',
            'react-is',
            'react-redux',
            'redux-first-router',
            'redux-first-router-link',
            'scheduler',
            'prop-types'
        ],
        output: outputAMD('map', banners.leaflet),
        plugins: [
            replace({
                ...replaceConf,
                // Avoid loading esri-leaflet
                "import { Tile } from './basemaps/index'":
                    "import Tile from './basemaps/Tile'",
                "import { Geojson, Highlight, Draw, Accuracy } from './overlays/index'":
                    "import Geojson from './overlays/Geojson'\n" +
                    "import Highlight from './overlays/Highlight'\n" +
                    "import Draw from './overlays/Draw'\n" +
                    "import Accuracy from './overlays/Accuracy'\n"
            }),
            { resolveId, load },
            wqDeps('.'),
            babelAMD({ jsx: true }),
            resolve({
                customResolveOptions: {
                    moduleDirectory: ['node_modules', '../react/node_modules']
                }
            }),
            commonjs()
        ]
    },
    {
        input: 'packages/leaflet/src/locate.js',
        external: ['leaflet'],
        output: outputAMD('locate', banners.locate, 'leaflet'),
        plugins: [{ resolveId }, babelAMD({ jsx: true })]
    },
    {
        input: 'packages/leaflet/src/mapserv.js',
        external: [
            'leaflet',
            'leaflet.markercluster',
            'mustache',
            'react',
            'react-dom',
            'react-is',
            'react-redux',
            'redux-orm',
            'redux-first-router',
            'redux-first-router-link',
            'scheduler',
            'prop-types',
            'esri-leaflet',
            'leaflet.wms'
        ],
        output: outputAMD('mapserv', banners.mapserv, 'leaflet'),
        plugins: [
            replace(replaceConf),
            { resolveId, load },
            wqDeps('.'),
            babelAMD({ jsx: true }),
            resolve({
                customResolveOptions: {
                    moduleDirectory: ['node_modules', '../react/node_modules']
                }
            }),
            commonjs(),
            json()
        ]
    }
];
