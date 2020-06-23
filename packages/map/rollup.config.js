import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2013);

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/map/src/map.js',
        plugins: [wqDeps('.'), babelAMD({ jsx: true })],
        external: ['react', 'prop-types', 'param-case'],
        output: outputAMD('map', banner)
    }
];
