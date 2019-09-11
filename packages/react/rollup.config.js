import pkg from './package.json';
import {
    makeBanner,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2019);

const external = [
    'react',
    'react-dom',
    'react-redux',
    'redux-first-router',
    'redux-first-router-link',
    'prop-types'
];

export default [
    // ESM
    {
        input: 'packages/react/index.js',
        plugins: [babelNPM({ jsx: true })],
        external,
        output: [
            {
                banner: banner,
                file: 'packages/react/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/react/index.js',
        plugins: [babelNPM({ jsx: true })],
        external,
        output: [
            {
                banner: banner,
                file: 'packages/react/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/react/index.js',
        plugins: [babelAMD({ jsx: true })],
        external,
        output: {
            ...outputAMD('react', banner),
            exports: 'named'
        }
    }
];
