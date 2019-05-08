import babelPlugin from 'rollup-plugin-babel';
import { CodeGenerator } from '@babel/generator';

export function wqDeps(path = '..') {
    return {
        resolveId: source => {
            if (source == '@wq/jquery-mobile') {
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

export function makeBanner(pkg, startYear) {
    const currentYear = new Date().getFullYear();
    return `/*
 * wq.app ${process.env.WQ_VERSION} - ${pkg.name} ${pkg.version}
 * ${pkg.description}
 * (c) ${startYear}-${currentYear}, S. Andrew Sheppard
 * https://wq.io/license
 */
`;
}

export function babel() {
    return babelPlugin({
        configFile: false,
        plugins: [
            '@babel/plugin-proposal-object-rest-spread',
            '@babel/plugin-transform-computed-properties',
            '@babel/plugin-transform-arrow-functions',
            generatorOverride
        ]
    });
}

function generator(ast, opts, code) {
    var generator = new CodeGenerator(ast, opts, code);
    generator._generator.format.indent.style = '    ';
    return generator.generate();
}

const generatorOverride = { generatorOverride: generator };
