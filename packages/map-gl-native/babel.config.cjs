module.exports = {
    env: {
        test: {
            plugins: [
                ['@babel/plugin-proposal-private-methods', { loose: true }]
            ],
            presets: ['module:metro-react-native-babel-preset']
        }
    }
};
