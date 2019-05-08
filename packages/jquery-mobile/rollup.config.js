import commonjs from 'rollup-plugin-commonjs';
export default [
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
