import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2019);

const external = ['react', 'prop-types'];

const material = {
    resolveId(id) {
        if (id.match(/@material-ui/)) {
            return { id, external: true };
        }
    }
};

export default [
    // ESM
    {
        input: 'packages/material/index.js',
        plugins: [wqDeps('@wq'), material, babelNPM({ jsx: true })],
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
        plugins: [wqDeps('@wq'), material, babelNPM({ jsx: true })],
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
        plugins: [wqDeps(), material, babelAMD({ jsx: true })],
        external,
        output: outputAMD('material', banner)
    }
];
