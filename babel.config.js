module.exports = {
    plugins: [
        [
            '@babel/plugin-transform-react-jsx',
            { useBuiltIns: true, useSpread: true }
        ]
    ],
    env: {
        test: {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                '@babel/preset-react'
            ]
        }
    }
};
