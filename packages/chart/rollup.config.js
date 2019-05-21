import ignore from 'rollup-plugin-ignore';
import pkg from './package.json';
import { makeBanner, wqDeps, babel } from '../../rollup-utils.js';
const banners = {
    chart: makeBanner(pkg, 2013),
    chartapp: makeBanner(
        {
            name: pkg.name + '/chartapp',
            description: 'wq/chart.js+wq/pandas.js as a wq/app.js plugin',
            version: pkg.version
        },
        2016
    ),
    pandas: makeBanner(
        {
            name: pkg.name + '/pandas',
            description:
                'Load and parse CSV with complex headers (e.g. from pandas DataFrames)',
            version: pkg.version
        },
        2014
    )
};

export default [
    // ESM
    {
        input: 'packages/chart/index.js',
        plugins: [wqDeps('@wq'), babel()],
        external: ['d3', 'whatwg-fetch'],
        output: [
            {
                banner: banners.chart,
                file: 'packages/chart/dist/index.es.js',
                format: 'esm'
            }
        ]
    },
    // CJS
    {
        input: 'packages/chart/index.js',
        plugins: [wqDeps('@wq'), babel()],
        external: ['d3', 'whatwg-fetch'],
        output: [
            {
                banner: banners.chart,
                file: 'packages/chart/dist/index.js',
                format: 'cjs',
                exports: 'named'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/chart/src/chart.js',
        plugins: [wqDeps(), babel()],
        external: ['d3'],
        output: [
            {
                banner: banners.chart,
                file: 'packages/chart/dist/chart.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/chart/src/chartapp.js',
        plugins: [wqDeps(), ignore(['whatwg-fetch']), babel()],
        external: ['d3', './chart', './pandas'],
        output: [
            {
                banner: banners.chartapp,
                file: 'packages/chart/dist/chartapp.js',
                format: 'amd',
                indent: false
            }
        ]
    },
    {
        input: 'packages/chart/src/pandas.js',
        plugins: [wqDeps(), ignore(['whatwg-fetch']), babel()],
        external: ['d3'],
        output: [
            {
                banner: banners.pandas,
                file: 'packages/chart/dist/pandas.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
