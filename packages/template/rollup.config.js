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
        input: 'packages/template/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['mustache'],
        output: [
            {
                banner: banner,
                file: 'packages/template/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/template/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['mustache'],
        output: [
            {
                banner: banner,
                file: 'packages/template/dist/index.js',
                format: 'cjs'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/template/index.js',
        plugins: [wqDeps(), babelAMD()],
        external: ['mustache'],
        output: outputAMD('template', banner)
    }
];
