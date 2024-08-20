export default {
    preset: "jest-expo",
    setupFiles: [
        "./node_modules/@maplibre/maplibre-react-native/setup-jest.js",
    ],
    testMatch: ["**/__tests__/**/*.js?(x)"],
    transformIgnorePatterns: [],
};
