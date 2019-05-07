export function wqDeps(path='..') {
    return {
        'resolveId': source => {
            if (source.match(/^@wq/)) {
                return {
                    id: source.replace('@wq', path),
                    external: true
                }
            }
            return null;
        }
    }
}

export function vendorLib(path) {
    const parts = path.split('/'),
          module = parts[parts.length - 1];
    return {
        'resolveId': source => {
            if (source === path) {
                return {id: module, external: true};
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
