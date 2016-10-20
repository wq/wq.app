requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'app': '../tests/js/app',
        'data': '../tests/js/data'
    }
});

require(['wq/app', 'wq/map', 'wq/locate', 'wq/markdown',
         'app/config', 'app/custom',
         'leaflet.draw'],
function(app, map, locate, markdown, config, custom) {
    config.jqmInit = true;
    app.use(map);
    app.use(locate);
    app.use(markdown);
    app.use(custom);
    app.init(config).then(function() {
        app.models.item.prefetch();
        app.models.itemtype.prefetch();
    });
});
