import commonjs from 'rollup-plugin-commonjs';
import { wqDeps, vendorLib } from '../../rollup-utils';

export default [
    // ESM
    {
        input: 'packages/jquery-mobile/index.js',
        plugins: [wqDeps('@wq'), commonjs()],
        external: ['jquery'],
        output: [
            {
                file: 'packages/jquery-mobile/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/jquery-mobile/index.js',
        plugins: [wqDeps('@wq'), commonjs()],
        external: ['jquery'],
        output: [
            {
                file: 'packages/jquery-mobile/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/jquery-mobile/src/jquery-mobile.js',
        plugins: [wqDeps('.'), vendorLib('../vendor/jquery-mobile')],
        external: ['jquery'],
        output: [
            {
                file: 'packages/jquery-mobile/dist/jquery-mobile.js',
                format: 'amd',
                name: 'jqmRenderer',
                indent: false
            }
        ]
    },
    {
        input: 'packages/jquery-mobile/vendor/jquery-mobile.js',
        plugins: [commonjs()],
        external: ['jquery'],
        output: [
            {
                file: 'packages/jquery-mobile/dist/jquery.mobile.vendor.js',
                format: 'amd',
                name: 'jqmInit',
                indent: false
            }
        ]
    }
];
