import commonjs from 'rollup-plugin-commonjs';
import pkg from './package.json';
import { makeBanner, wqDeps, vendorLib, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    {
        input: 'packages/router/index.js',
        plugins: [
            wqDeps(),
            babel(),
            vendorLib('../vendor/jquery.mobile.router')
        ],
        output: [
            {
                banner: banner,
                file: 'packages/router/dist/router.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/router/vendor/jquery.mobile.router.js',
        plugins: [commonjs()],
        output: [
            {
                file: 'packages/router/dist/jquery.mobile.router.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
