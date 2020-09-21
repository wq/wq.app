import ignore from 'rollup-plugin-ignore';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import pkg from './package.json';
import { makeBanner, wqDeps, babelAMD, outputAMD } from '../../rollup-utils.js';
const banner = makeBanner(pkg, 2012);

const autoMergeLevel2 = 'redux-persist/lib/stateReconciler/autoMergeLevel2';
const resolveMerge = resolve({
    resolveOnly: ['redux-persist']
});
resolveMerge.resolveId = (defaultResolveId => {
    return (source, importer) => {
        if (source === autoMergeLevel2) {
            source = source.replace('lib', 'es');
        }
        return defaultResolveId(source, importer);
    };
})(resolveMerge.resolveId);

export default [
    // AMD (for wq.app Python package)
    {
        input: 'packages/store/index.js',
        external: ['redux', 'redux-logger', 'redux-persist', 'localforage'],
        plugins: [
            ignore(['whatwg-fetch']),
            wqDeps(),
            babelAMD(),
            resolveMerge,
            replace({
                'process.env.NODE_ENV': "'production'"
            })
        ],
        output: {
            ...outputAMD('store', banner),
            exports: 'named',
            globals: { 'whatwg-fetch': 'fetch' }
        }
    }
];
