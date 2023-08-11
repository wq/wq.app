module.exports = {
    env: {
        test: {
            plugins: [
                ["@babel/plugin-transform-private-methods", { loose: true }],
            ],
            presets: ["module:metro-react-native-babel-preset"],
        },
    },
};
