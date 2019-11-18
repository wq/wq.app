import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';

const banner = makeBanner(pkg, 2019);

export default [
    // ESM
    {
        input: 'packages/mapbox/index.js',
        plugins: [wqDeps('@wq'), babelNPM({ jsx: true })],
        external: ['react', 'prop-types', 'react-mapbox-gl', 'mapbox-gl'],
        output: [
            {
                banner,
                file: 'packages/mapbox/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/mapbox/index.js',
        plugins: [wqDeps('@wq'), babelNPM({ jsx: true })],
        external: ['react', 'prop-types', 'react-mapbox-gl', 'mapbox-gl'],
        output: [
            {
                banner,
                file: 'packages/mapbox/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/mapbox/src/index.js',
        plugins: [wqDeps('.'), babelAMD({ jsx: true })],
        external: ['react', 'mapbox'],
        output: outputAMD('mapbox', banner)
    }
];
