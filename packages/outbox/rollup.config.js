import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    vendorLib,
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

export default [
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
                file: 'js/json-forms.js',
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
                file: 'js/redux-offline.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
