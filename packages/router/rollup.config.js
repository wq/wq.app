import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // ESM
    {
        input: 'packages/router/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['redux-first-router', 'query-string'],
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
        external: ['redux-first-router', 'query-string'],
        plugins: [wqDeps('@wq'), babelNPM()],
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
        plugins: [wqDeps(), commonjs(), babelAMD(), resolve()],
        external: ['redux', 'redux-first-router'],
        output: outputAMD('router', banner)
    }
];
