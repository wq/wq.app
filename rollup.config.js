import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import replace from '@rollup/plugin-replace';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';
import analyze from 'rollup-plugin-analyzer';
import child_process from 'child_process';

/*
 * NOTE: This config is specific to the wq.app monorepo.
 * If you want to customize a wq.js build, start from
 * https://github.com/wq/wq/blob/master/rollup.config.js
 * instead, as it uses npm instead of overriding paths.
 */

const version = child_process.execSync('python3 setup.py --version');

const banner = `/*!
 * wq.js for wq.app ${version}
 * Mobile data collection & survey framework
 * (c) 2012-2020, S. Andrew Sheppard
 * https://wq.io/license
 */`;

const deps = {
    '@wq/app': './packages/app/src/app.js',
    '@wq/store': './packages/store/src/store.js',
    '@wq/router': './packages/router/src/router.js',
    '@wq/model': './packages/model/src/model.js',
    '@wq/outbox': './packages/outbox/src/outbox.js',
    '@wq/react': './packages/react/src/index.js',
    '@wq/material': './packages/material/src/index.js',
    '@wq/map': './packages/map/src/index.js',
    '@wq/mapbox': './packages/mapbox/src/index.js'
};
function resolveId(id) {
    return deps[id];
}

export default [
    {
        input: 'index.js',
        plugins: [
            babel({
                presets: ['@babel/preset-typescript'],
                plugins: [
                    ['@babel/plugin-transform-react-jsx', { useSpread: true }]
                ],
                extensions: ['.js', '.ts', '.tsx'],
                babelHelpers: 'bundled'
            }),
            terser(),
            { resolveId },
            resolve({
                preferBuiltins: false,
                customResolveOptions: {
                    moduleDirectory: [
                        './packages/store/node_modules/',
                        './packages/router/node_modules/',
                        './packages/model/node_modules/',
                        './packages/outbox/node_modules/',
                        './packages/react/node_modules/',
                        './packages/material/node_modules/',
                        './packages/map/node_modules/',
                        './packages/mapbox/node_modules/',
                        'node_modules/'
                    ]
                },
                extensions: ['.js', '.ts', '.tsx'],
                dedupe: path => path[0] !== '.'
            }),
            analyze({ limit: 10 }),
            replace({
                'process.env.NODE_ENV': '"production"',
                "require('fs')": 'NOT_SUPPORTED',
                "require('path')": 'NOT_SUPPORTED',
                'require.main': "'NOT_SUPPORTED'",
                "import * as MapboxGl from 'mapbox-gl'":
                    "import MapboxGl from 'mapbox-gl'",
                "const isEqual = require('deep-equal')":
                    "import isEqual from 'deep-equal'",
                "require('mapbox-gl/dist/mapbox-gl.css')": '',
                "'react-mapbox-gl'": "'react-mapbox-gl/src/index'",
                '"react-mapbox-gl"': "'react-mapbox-gl/src/index'",
                delimiters: ['', '']
            }),
            commonjs(),
            json()
        ],
        output: {
            file: 'static/app/js/wq.js',
            banner,
            sourcemap: true,
            format: 'esm'
        }
    }
];
