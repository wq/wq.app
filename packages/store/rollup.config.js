import ignore from 'rollup-plugin-ignore';
import pkg from './package.json';
import { makeBanner, wqDeps, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // ESM
    {
        input: 'packages/store/index.js',
        plugins: [wqDeps('@wq'), babel()],
        external: [
            'redux',
            'redux-logger',
            'localforage',
            'localforage-memoryStorageDriver',
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
        plugins: [wqDeps('@wq'), babel()],
        external: [
            'redux',
            'redux-logger',
            'localforage',
            'localforage-memoryStorageDriver',
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
        external: [
            'redux',
            'redux-logger',
            'localforage',
            'localforage-memoryStorageDriver'
        ],
        plugins: [ignore(['whatwg-fetch']), wqDeps(), babel()],
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
