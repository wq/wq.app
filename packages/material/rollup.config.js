import babel from '@rollup/plugin-babel';

export default [
    {
        input:
            'packages/material/node_modules/material-ui-dropzone/src/index.js',
        plugins: [
            babel({
                plugins: [
                    '@babel/plugin-proposal-optional-chaining',
                    '@babel/plugin-proposal-nullish-coalescing-operator'
                ]
            }),
            {
                resolveId(id) {
                    if (id.startsWith('@material-ui/')) {
                        return { id, external: true };
                    }
                }
            }
        ],
        external: ['react', 'prop-types', 'clsx', 'react-dropzone'],
        output: {
            file: 'packages/material/src/vendor/material-ui-dropzone.js'
        }
    }
];
