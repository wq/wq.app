import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';
import { makeBanner, wqDeps, babelAMD, outputAMD } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/router/index.js',
        plugins: [wqDeps(), commonjs(), babelAMD(), resolve()],
        external: ['redux', 'redux-first-router'],
        output: outputAMD('router', banner)
    }
];
