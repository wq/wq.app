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
        input: 'packages/model/index.js',
        plugins: [wqDeps('@wq'), commonjs(), resolve(), babelNPM()],
        external: ['redux-orm'],
        output: [
            {
                banner: banner,
                file: 'packages/model/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/model/index.js',
        plugins: [wqDeps('@wq'), commonjs(), resolve(), babelNPM()],
        external: ['redux-orm'],
        output: [
            {
                banner: banner,
                file: 'packages/model/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/model/index.js',
        plugins: [wqDeps(), commonjs(), resolve(), babelAMD()],
        external: ['redux-orm'],
        output: {
            ...outputAMD('model', banner),
            exports: 'named'
        }
    },
    {
        input: 'packages/model/node_modules/redux-orm/es/index.js',
        plugins: [resolve(), commonjs()],
        output: [
            {
                file: 'packages/model/dist/redux-orm.js',
                format: 'amd',
                exports: 'named',
                indent: false
            }
        ]
    }
];
