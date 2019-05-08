import commonjs from 'rollup-plugin-commonjs';
import resolve from 'rollup-plugin-node-resolve';
import pkg from './package.json';
import {makeBanner, wqDeps, babel} from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default {
    'input': 'packages/model/index.js',
    'plugins': [wqDeps(), commonjs(), resolve(), babel()],
    'output': [
        {
            'banner': banner,
            'file': 'packages/model/dist/model.js',
            'format': 'amd',
            'indent': false
        }
    ]
}
