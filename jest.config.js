module.exports = {
    testEnvironment: "jsdom",
    setupFiles: ["fake-indexeddb/auto", "whatwg-fetch"],
    testMatch: ["**/__tests__/**/*.js?(x)"],
    testPathIgnorePatterns: ["/node_modules/", ".mock.js"],
    transformIgnorePatterns: [
        "/node_modules/(?!(redux-orm|@mapbox/mapbox-gl-draw|@wq|query-string|decode-uri-component|split-on-first|filter-obj))",
    ],
};
