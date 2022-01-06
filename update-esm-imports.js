module.exports = function () {
    return {
        name: 'update-esm-imports',
        visitor: {
            ImportDeclaration(path) {
                const module = path.node.source.value,
                    dirs = module.split('/').length - 1;
                if (
                    module.endsWith('.js') ||
                    dirs === 0 ||
                    (module.startsWith('@') && dirs === 1)
                ) {
                    return;
                }
                if (module.startsWith('./') || module.startsWith('../')) {
                    path.node.source.value += '.js';
                    return;
                }
                const mapping = MAPPINGS.find(mapping =>
                    module.startsWith(mapping.prefix)
                );
                if (!mapping) {
                    throw new Error(`Unexpected import from ${module}`);
                }
                path.node.source.value += mapping.extension;
            },
            ExportAllDeclaration(path) {
                const module = path.node.source.value;
                if (module.endsWith('.js')) {
                    return;
                } else if (module.startsWith('./')) {
                    path.node.source.value += '.js';
                } else {
                    throw new Error(`Unexpected export * from ${module}`);
                }
            }
        }
    };
};

const MAPPINGS = [
    { prefix: '@material-ui/core/', extension: '/index.js' },
    { prefix: '@material-ui/icons/', extension: '.js' },
    { prefix: '@material-ui/lab/', extension: '/index.js' },
    { prefix: 'date-fns/', extension: '/index.js' },
    { prefix: 'redux-persist/lib/', extension: '.js' }
];
