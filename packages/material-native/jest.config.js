export default {
    preset: "react-native",
    setupFiles: [
        "./node_modules/react-native-gesture-handler/jestSetup.js",
        "./setup-jest.js",
    ],
    testMatch: ["**/__tests__/**/*.js?(x)"],
    transformIgnorePatterns: [],
};
