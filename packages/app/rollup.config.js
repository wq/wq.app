import pkg from './package.json';
import { makeBanner, wqDeps, babel } from '../../rollup-utils.js';
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
        plugins: [wqDeps('@wq'), babel()],
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
        plugins: [wqDeps('@wq'), babel()],
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
        plugins: [wqDeps('.'), babel()],
        external: ['./spinner'],
        output: [
            {
                banner: banners.app,
                file: 'packages/app/dist/app.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/app/src/patterns.js',
        plugins: [wqDeps('.'), babel()],
        output: [
            {
                banner: banners.patterns,
                file: 'packages/app/dist/patterns.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/app/src/photos.js',
        plugins: [wqDeps('.'), babel()],
        output: [
            {
                banner: banners.photos,
                file: 'packages/app/dist/photos.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/app/src/spinner.js',
        plugins: [babel()],
        output: [
            {
                banner: banners.spinner,
                file: 'packages/app/dist/spinner.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
