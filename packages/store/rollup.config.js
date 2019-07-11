import ignore from 'rollup-plugin-ignore';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import { makeBanner, wqDeps, babelNPM, babelAMD } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

const autoMergeLevel2 = 'redux-persist/es/stateReconciler/autoMergeLevel2';
const resolveMerge = resolve({
    only: ['redux-persist']
});

export default [
    // ESM
    {
        input: 'packages/store/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: [
            'redux',
            'redux-logger',
            'redux-persist',
            autoMergeLevel2,
            'localforage',
            'whatwg-fetch'
        ],
        output: [
            {
                banner: banner,
                file: 'packages/store/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/store/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: [
            'redux',
            'redux-logger',
            'redux-persist',
            autoMergeLevel2,
            'localforage',
            'whatwg-fetch'
        ],
        output: [
            {
                banner: banner,
                file: 'packages/store/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/store/index.js',
        external: ['redux', 'redux-logger', 'redux-persist', 'localforage'],
        plugins: [ignore(['whatwg-fetch']), wqDeps(), babelAMD(), resolveMerge],
        output: [
            {
                banner: banner,
                file: 'packages/store/dist/store.js',
                format: 'amd',
                exports: 'named',
                globals: { 'whatwg-fetch': 'fetch' },
                indent: false
            }
        ]
    }
];
