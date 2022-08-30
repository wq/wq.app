module.exports = {
    testMatch: ['**/__tests__/**/*.js?(x)'],
    testPathIgnorePatterns: ['/node_modules/', '.mock.js'],
    transformIgnorePatterns: [
        '/node_modules/(?!(redux-orm|@mapbox/mapbox-gl-draw|@wq))'
    ]
};
