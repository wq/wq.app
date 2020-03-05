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
        input: 'packages/app/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['mustache'],
        output: [
            {
                banner,
                file: 'packages/app/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/app/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['mustache'],
        output: [
            {
                banner,
                file: 'packages/app/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/app/src/app.js',
        plugins: [wqDeps(), babelAMD()],
        external: ['mustache'],
        output: outputAMD('app', banner)
    }
];
