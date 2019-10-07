import pkg from './package.json';
import {
    makeBanner,
    wqDeps,
    babelNPM,
    babelAMD,
    outputAMD
} from '../../rollup-utils.js';
const banners = {
    app: makeBanner(pkg, 2012),
    patterns: makeBanner(
        {
            name: pkg.name + '/patterns',
            description:
                'wq/app.js plugin to handle dynamically adding nested forms',
            version: pkg.version
        },
        2016
    ),
    photos: makeBanner(
        {
            name: pkg.name + '/photos',
            description: 'Helpers for working with Cordova photo library',
            version: pkg.version
        },
        2012
    ),
    spinner: makeBanner(
        {
            name: pkg.name + '/spinner',
            description: "Wrapper for jQuery Mobile's spinner",
            version: pkg.version
        },
        2012
    )
};

export default [
    // ESM
    {
        input: 'packages/app/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['localforage'],
        output: [
            {
                banner: banners.app,
                file: 'packages/app/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/app/index.js',
        plugins: [wqDeps('@wq'), babelNPM()],
        external: ['localforage'],
        output: [
            {
                banner: banners.app,
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
        external: ['./spinner'],
        output: outputAMD('app', banners.app)
    },
    {
        input: 'packages/app/src/patterns.js',
        plugins: [wqDeps(), babelAMD()],
        output: outputAMD('patterns', banners.patterns, 'app')
    },
    {
        input: 'packages/app/src/photos.js',
        plugins: [wqDeps(), babelAMD()],
        external: ['localforage'],
        output: outputAMD('photos', banners.photos, 'app')
    },
    {
        input: 'packages/app/src/spinner.js',
        plugins: [babelAMD()],
        output: outputAMD('spinner', banners.spinner, 'app')
    }
];
