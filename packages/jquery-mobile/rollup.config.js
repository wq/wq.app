import pkg from './package.json';
import commonjs from '@rollup/plugin-commonjs';
import {
    makeBanner,
    babelAMD,
    outputAMD,
    vendorLib
} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/jquery-mobile/src/jquery-mobile.js',
        plugins: [
            babelAMD(),
            vendorLib('../vendor/jquery-mobile', 'jquery.mobile')
        ],
        external: ['jquery', 'mustache', 'localforage'],
        output: outputAMD('jquery-mobile', banner)
    },
    {
        input: 'packages/jquery-mobile/vendor/jquery-mobile.js',
        plugins: [commonjs()],
        external: ['jquery'],
        output: [
            {
                file: 'js/jquery.mobile.js',
                format: 'amd',
                name: 'jqmInit',
                indent: false
            }
        ]
    }
];
