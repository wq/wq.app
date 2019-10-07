import babelPlugin from 'rollup-plugin-babel';
import { CodeGenerator } from '@babel/generator';
import { execSync } from 'child_process';

export function wqDeps(path = '.') {
    return {
        resolveId: source => {
            if (path != '@wq' && source == '@wq/jquery-mobile') {
                return {
                    id: 'jquery.mobile',
                    external: true
                };
            } else if (source.match(/^@wq/)) {
                return {
                    id: source.replace('@wq', path),
                    external: true
                };
            }
            return null;
        }
    };
}

export function vendorLib(path) {
    const parts = path.split('/'),
        module = parts[parts.length - 1];
    return {
        resolveId: source => {
            if (source === path) {
                return { id: module, external: true };
            }
        }
    };
}

function getGitVersion() {
    try {
        const version = execSync('git describe --tags', { encoding: 'utf-8' });
        return version.trim();
    } catch (e) {
        return 'UNKNOWN';
    }
}

export function makeBanner(pkg, startYear) {
    const currentYear = new Date().getFullYear(),
        appVersion = getGitVersion();
    return `/*
 * wq.app ${appVersion} - ${pkg.name} ${pkg.version}
 * ${pkg.description}
 * (c) ${startYear}-${currentYear}, S. Andrew Sheppard
 * https://wq.io/license
 */
`;
}

export function babelNPM() {
    return babelPlugin({
        configFile: false,
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        node: 8
                    }
                }
            ]
        ],
        plugins: ['@babel/plugin-proposal-class-properties', generatorOverride]
    });
}

export function babelAMD() {
    const plugin = babelPlugin({
        configFile: false,
        presets: [
            [
                '@babel/preset-env',
                {
                    targets: {
                        ie: '11'
                    }
                }
            ]
        ],
        plugins: [
            '@babel/plugin-proposal-class-properties',
            [
                '@babel/plugin-transform-runtime',
                {
                    regenerator: true,
                    helpers: false
                }
            ],
            generatorOverride
        ]
    });
    const defaultResolveId = plugin.resolveId;
    plugin.resolveId = path => {
        const resolved = defaultResolveId(path);
        if (resolved) {
            return resolved;
        }
        if (path === '@babel/runtime/regenerator') {
            return {
                id: 'regenerator-runtime',
                external: true
            };
        }
    };
    return plugin;
}

function generator(ast, opts, code) {
    var generator = new CodeGenerator(ast, opts, code);
    generator._generator.format.indent.style = '    ';
    return generator.generate();
}

const generatorOverride = { generatorOverride: generator };

export function outputAMD(name, banner, module) {
    if (!module) {
        module = name;
    }
    return {
        banner,
        file: `packages/${module}/dist/${name}.js`,
        format: 'amd',
        sourcemap: true,
        sourcemapPathTransform: path =>
            '../' +
            // eslint-disable-next-line no-useless-escape
            path.replace(/^\.\.\/src/, `../node_modules\/@wq\/${module}\/src`),
        indent: false
    };
}
