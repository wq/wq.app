import commonjs from 'rollup-plugin-commonjs';
export default [
    // ESM
    {
        input: 'packages/jquery-mobile/index.js',
        plugins: [commonjs()],
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
        plugins: [commonjs()],
        external: ['jquery'],
        output: [
            {
                file: 'packages/jquery-mobile/dist/index.js',
                format: 'cjs'
            }
        ]
    },
    // AMD (for wq.app Python package)
    {
        input: 'packages/jquery-mobile/src/jquery-mobile.js',
        plugins: [commonjs()],
        external: ['jquery'],
        output: [
            {
                file: 'packages/jquery-mobile/dist/jquery.mobile.js',
                format: 'amd',
                indent: false
            }
        ]
    }
];
