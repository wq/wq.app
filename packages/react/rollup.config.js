import babel from "@rollup/plugin-babel";

export default [
    {
        input: "node_modules/redux-first-router-link/src/index.js",
        plugins: [
            babel({
                plugins: ["@babel/plugin-transform-flow-strip-types"],
            }),
            {
                resolveId(id) {
                    if (
                        id === "rudy-history/PathUtils" ||
                        id === "redux-first-router" ||
                        id === "rudy-match-path"
                    ) {
                        return {
                            id: "./redux-first-router.js",
                            external: true,
                        };
                    }
                },
            },
        ],
        external: ["react", "react-redux"],
        output: {
            file: "packages/react/src/vendor/redux-first-router-link.js",
        },
    },
];
