import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import resolve from "@rollup/plugin-node-resolve";
import replace from "@rollup/plugin-replace";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import analyze from "rollup-plugin-analyzer";
import license from "rollup-plugin-license";
import child_process from "child_process";
import { readFileSync } from "fs";

/*
 * NOTE: This config is specific to the wq.app monorepo.
 * If you want to customize a wq.js build, start from
 * https://github.com/wq/wq/blob/main/rollup.config.js
 * instead, as it uses npm instead of overriding paths.
 */

const version = child_process.execSync("python3 -m setuptools_scm");

const banner = `/*!
 * wq.js for wq.app ${version}
 * Mobile data collection & survey framework
 * (c) 2012-2023, S. Andrew Sheppard
 * https://wq.io/license
 */`;

const deps = {
    "@wq/app": "./packages/app/src/app.js",
    "@wq/store": "./packages/store/src/index.js",
    "@wq/router": "./packages/router/src/router.js",
    "@wq/model": "./packages/model/src/index.js",
    "@wq/outbox": "./packages/outbox/src/outbox.js",
    "@wq/react": "./packages/react/src/index.js",
    "@wq/material": "./packages/material/src/index.js",
    "@wq/material-web": "./packages/material-web/src/index.js",
    "@wq/map": "./packages/map/src/index.js",
    "@wq/map-gl": "./packages/map-gl/src/index.js",
    "@wq/map-gl-web": "./packages/map-gl-web/src/index.js",
    "mui-file-dropzone": "./node_modules/mui-file-dropzone/src/index.ts",
};
function resolveId(id) {
    if (id == "maplibre-gl") {
        return { id: "./maplibre-gl.js", external: true };
    }
    return deps[id];
}

const config = {
        input: "index.js",
        plugins: [
            babel({
                presets: ["@babel/preset-typescript"],
                plugins: [
                    ["@babel/plugin-transform-react-jsx", { useSpread: true }],

                    // For redux-orm/src/
                    "@babel/plugin-proposal-class-properties",

                    [
                        "babel-plugin-direct-import",
                        {
                            modules: [
                                "@mui/system",
                                "@mui/material",
                                "@mui/icons-material",
                            ],
                        },
                    ],
                ],
                extensions: [".js", ".ts", ".tsx"],
                babelHelpers: "bundled",
            }),
            { resolveId },
            resolve({
                preferBuiltins: false,
                extensions: [".js", ".ts", ".tsx"],
            }),
            analyze({ limit: 10 }),
        ],
        output: {
            inlineDynamicImports: true,
            banner,
            format: "esm",
            sourcemap: true,
            sourcemapPathTransform(path) {
                return path.replace("../../../../../", `wq/app/`);
            },
        },
    },
    replaceConfig = {
        "import maplibre from": "import",
        "mapgl.setEngine(maplibre)": "mapgl.setEngine(window.maplibregl)",
        delimiters: ["", ""],
        preventAssignment: true,
    };

export default [
    {
        ...config,
        output: { ...config.output, file: "wq/app/static/app/js/wq.js" },
        plugins: [
            ...config.plugins,
            license({
                thirdParty: {
                    output: {
                        file: "LICENSES.md",
                        template: thirdPartyMarkdown,
                    },
                    allow: {
                        failOnViolation: true,
                        test(dependency) {
                            return [
                                "MIT",
                                "ISC",
                                "BSD-3-Clause",
                                "BSD-2-Clause",
                                "0BSD",
                                "Apache-2.0",
                                "MIT/X11",
                                "Unlicense",
                            ].includes(dependency.license);
                        },
                    },
                },
            }),
            terser({ keep_fnames: /^([A-Z]|use[A-Z])/ }), // Preserve component & hook names
            replace({
                ...replaceConfig,
                "process.env.NODE_ENV": '"production"',
            }),
            commonjs(),
            json(),
        ],
    },
    {
        ...config,
        output: { ...config.output, file: "wq/app/static/app/js/wq.dev.js" },
        plugins: [
            ...config.plugins,
            replace({
                ...replaceConfig,
                "process.env.NODE_ENV": '"development"',
            }),
            commonjs(),
            json(),
        ],
    },
];

function thirdPartyMarkdown(dependencies) {
    dependencies.sort((dep1, dep2) => {
        const name1 = dep1.name.replace("@", ""),
            name2 = dep2.name.replace("@", "");
        if (name1 < name2) {
            return -1;
        } else if (name1 > name2) {
            return 1;
        } else {
            return 0;
        }
    });
    const wqDeps = dependencies.filter((dep) => dep.name.startsWith("@wq")),
        wqLicense = readFileSync("LICENSE", { encoding: "utf-8" }),
        otherDeps = dependencies.filter((dep) => !dep.name.startsWith("@wq"));

    let markdown = "";

    // @wq/* packages
    markdown +=
        "# Licenses\nThe [**wq.js**](https://wq.io/wq) bundle includes ";
    wqDeps.forEach((dep, i) => {
        if (i === wqDeps.length - 1) {
            markdown += " and ";
        }
        markdown += `[**${dep.name}**](${dep.homepage}), `;
    });
    markdown += `under the following MIT License:\n${formatLicense(
        wqLicense
    )}\n\n`;

    // Third party packages
    markdown +=
        "## Third Party\nIn addition, the following third party dependencies are compiled into [**wq.js**](https://wq.io/wq).   Except where noted, most use the MIT License.\n\n";
    otherDeps.forEach((dep) => {
        let license = dep.license;
        if (dep.name === "jsonlint-lines") {
            license = "MIT";
        }

        if (license === "MIT") {
            license = "";
        } else {
            license = ` <i>(${license})</i>`;
        }

        const title = `<b><a href="${dep.homepage}">${dep.name}</a> ${dep.version}</b>${license}`;
        if (dep.licenseText) {
            markdown += `<details><summary>${title}</summary>\n${formatLicense(
                dep.licenseText
            )}</details>\n\n`;
        } else {
            markdown += `&nbsp; &nbsp; ${title}\n\n`;
        }
    });

    return markdown;
}

function formatLicense(licenseText) {
    return "\n> " + licenseText.split("\n").join("\n> ") + "\n\n";
}
