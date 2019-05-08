import pkg from './package.json';
import { makeBanner, wqDeps, babel } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default {
    input: 'packages/template/index.js',
    plugins: [wqDeps(), babel()],
    external: ['mustache'],
    output: [
        {
            banner: banner,
            file: 'packages/template/dist/template.js',
            format: 'amd',
            indent: false
        }
    ]
};
