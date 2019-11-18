import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2013);

export default [
    // ESM
    {
        input: 'packages/map/index.js',
        plugins: [wqDeps('@wq'), babelNPM({ jsx: true })],
        external: ['react', 'prop-types', 'param-case'],
        output: [
            {
                banner: banner,
                file: 'packages/map/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/map/index.js',
        plugins: [wqDeps('@wq'), babelNPM({ jsx: true })],
        external: ['react', 'prop-types', 'param-case'],
        output: [
            {
                banner: banner,
                file: 'packages/map/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/map/src/map.js',
        plugins: [wqDeps('.'), babelAMD({ jsx: true })],
        external: ['react', 'prop-types', 'param-case'],
        output: outputAMD('map', banner)
    }
];
