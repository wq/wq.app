import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import { makeBanner, wqDeps, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // ESM
    {
        input: 'packages/model/index.js',
        plugins: [wqDeps('@wq'), commonjs(), resolve(), babel()],
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
        plugins: [wqDeps('@wq'), commonjs(), resolve(), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/model/dist/index.js',
                format: 'cjs'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/model/index.js',
        plugins: [wqDeps(), commonjs(), resolve(), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/model/dist/model.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
