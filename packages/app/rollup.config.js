import pkg from './package.json';
import { makeBanner, wqDeps, babelAMD, outputAMD } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/app/src/app.js',
        plugins: [wqDeps(), babelAMD()],
        external: ['mustache', 'deepcopy'],
        output: outputAMD('app-core', banner, 'app')
    }
];
