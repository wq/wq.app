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
    'redux-first-router-link',
    '@material-ui/core',
    '@material-ui/styles'
];

export default [
    // ESM
    {
        input: 'packages/material/index.js',
        plugins: [babelNPM({ jsx: true })],
        external,
        output: [
            {
                banner: banner,
                file: 'packages/material/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/material/index.js',
        plugins: [babelNPM({ jsx: true })],
        external,
        output: [
            {
                banner: banner,
                file: 'packages/material/dist/index.js',
                format: 'cjs'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/material/index.js',
        plugins: [babelAMD({ jsx: true })],
        external,
        output: outputAMD('material', banner)
    }
];
