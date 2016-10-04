requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'app': '../tests/js/app',
        'data': '../tests/js/data'
    }
});

require(['wq/app', 'wq/map', 'wq/locate',
         'app/config', 'app/custom',
         'leaflet.draw'],
function(app, map, locate, config, custom) {
    config.jqmInit = true;
    app.use(map);
    app.use(locate);
    app.use(custom);
    app.init(config);
});
