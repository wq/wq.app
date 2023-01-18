export default {
    preset: 'jest-expo',
    setupFiles: [
        './node_modules/react-native-gesture-handler/jestSetup.js',
        './node_modules/@rnmapbox/maps/setup-jest.js',
        './setup-jest.js'
    ],
    testMatch: ['**/__tests__/**/*.js?(x)'],
    transformIgnorePatterns: [],
    moduleNameMapper: { '@wq/material': '<rootDir>/setup-jest.js' }
};
