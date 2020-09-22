import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import pkg from './package.json';
import { makeBanner, wqDeps, babelAMD, outputAMD } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/model/index.js',
        plugins: [
            wqDeps(),
            {
                resolveId(id) {
                    if (id === 'redux-orm/src/index.js') {
                        return { id: 'redux-orm', external: true };
                    }
                }
            },
            commonjs(),
            babelAMD(),
            resolve()
        ],
        external: ['redux-orm', 'deepcopy'],
        output: {
            ...outputAMD('model', banner),
            exports: 'named'
        }
    },
    {
        input: 'packages/model/node_modules/redux-orm/src/index.js',
        plugins: [resolve(), commonjs(), babelAMD()],
        output: [
            {
                file: 'js/redux-orm.js',
                format: 'amd',
                exports: 'named',
                indent: false
            }
        ]
    }
];
