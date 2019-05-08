import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import { makeBanner, vendorLib, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2013);

export default [
    {
        input: 'packages/markdown/index.js',
        external: ['marked'],
        plugins: [vendorLib('./highlight'), babel()],
        output: [
            {
                banner: banner,
                file: 'packages/markdown/dist/markdown.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/markdown/src/highlight.js',
        plugins: [commonjs(), resolve()],
        output: [
            {
                file: 'packages/markdown/dist/highlight.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];