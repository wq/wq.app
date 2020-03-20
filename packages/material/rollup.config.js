import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD,
    resolveNative
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2019);

const material = {
    resolveId(id) {
        if (id.match(/@material-ui/)) {
            return { id, external: true };
        }
    }
};

const config = {
    input: 'packages/material/index.js',
    plugins: [wqDeps('@wq'), material, babelNPM({ jsx: true })],
    external: ['react', 'prop-types']
};

export default [
    // ESM
    {
        ...config,
        output: {
            banner,
            file: 'packages/material/dist/index.es.js',
            format: 'esm'
        }
    },

    // ESM for react-native
    {
        ...config,
        plugins: [...config.plugins, resolveNative()],
        output: {
            banner,
            file: 'packages/material/dist/index.es.native.js',
            format: 'esm'
        }
    },

    // CJS
    {
        ...config,
        output: {
            banner,
            file: 'packages/material/dist/index.js',
            format: 'cjs'
        }
    },

    // CJS for react-native
    {
        ...config,
        plugins: [...config.plugins, resolveNative()],
        output: {
            banner,
            file: 'packages/material/dist/index.native.js',
            format: 'cjs'
        }
    },

    // AMD (for wq.app Python package)
    {
        ...config,
        plugins: [wqDeps(), material, babelAMD({ jsx: true })],
        output: outputAMD('material', banner)
    }
];
