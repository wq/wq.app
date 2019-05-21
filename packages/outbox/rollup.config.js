import pkg from './package.json';
import { makeBanner, wqDeps, vendorLib, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // ESM
    {
        input: 'packages/outbox/index.js',
        plugins: [wqDeps('@wq'), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/outbox/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/outbox/index.js',
        plugins: [wqDeps('@wq'), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/outbox/dist/index.js',
                format: 'cjs'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/outbox/index.js',
        external: ['json-forms'],
        plugins: [wqDeps(), vendorLib('../vendor/json-forms'), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/outbox/dist/outbox.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/outbox/vendor/json-forms.js',
        output: [
            {
                file: 'packages/outbox/dist/json-forms.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
