import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import { makeBanner, wqDeps, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // ESM
    {
        input: 'packages/router/index.js',
        plugins: [wqDeps('@wq'), babel()],
        external: ['redux', 'redux-first-router', 'query-string'],
        output: [
            {
                banner: banner,
                file: 'packages/router/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/router/index.js',
        external: ['redux', 'redux-first-router', 'query-string'],
        plugins: [wqDeps('@wq'), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/router/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/router/index.js',
        plugins: [wqDeps(), babel(), resolve(), commonjs()],
        external: ['redux', 'redux-first-router'],
        output: [
            {
                banner: banner,
                file: 'packages/router/dist/router.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
