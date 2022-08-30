export default {
    preset: 'jest-expo',
    setupFiles: [
        './node_modules/react-native-gesture-handler/jestSetup.js',
        './node_modules/@react-native-mapbox-gl/maps/setup-jest.js'
    ],
    testMatch: ['**/__tests__/**/*.js?(x)'],
    transformIgnorePatterns: []
};
