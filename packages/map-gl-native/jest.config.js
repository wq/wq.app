export default {
    preset: "jest-expo",
    setupFiles: [
        "./node_modules/@maplibre/maplibre-react-native/setup-jest.js",
        "./setup-jest.js",
    ],
    testMatch: ["**/__tests__/**/*.js?(x)"],
    transformIgnorePatterns: [],
    moduleNameMapper: { "@wq/material": "<rootDir>/setup-jest.js" },
};
