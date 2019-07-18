import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    vendorLib,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

const offlineForAMD = {
    resolveId(path) {
        if (path === './offline') {
            return {
                id: 'redux-offline',
                external: true
            };
        }
    }
};

const offlineForNPM = {
    resolveId(path) {
        if (path.match(/^@redux-offline/)) {
            return {
                id: path,
                external: true
            };
        }
    }
};

export default [
    // ESM
    {
        input: 'packages/outbox/index.js',
        plugins: [offlineForNPM, wqDeps('@wq'), babelNPM()],
        output: [
            {
                banner: banner,
                file: 'packages/outbox/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/outbox/index.js',
        plugins: [offlineForNPM, wqDeps('@wq'), babelNPM()],
        output: [
            {
                banner: banner,
                file: 'packages/outbox/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/outbox/index.js',
        plugins: [
            offlineForAMD,
            wqDeps(),
            vendorLib('../vendor/json-forms'),
            babelAMD()
        ],
        output: {
            ...outputAMD('outbox', banner),
            exports: 'named'
        }
    },
    {
        input: 'packages/outbox/vendor/json-forms.js',
        output: [
            {
                file: 'packages/outbox/dist/json-forms.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/outbox/src/offline.js',
        plugins: [resolve(), commonjs()],
        external: ['redux', 'redux-persist'],
        output: [
            {
                file: 'packages/outbox/dist/redux-offline.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
