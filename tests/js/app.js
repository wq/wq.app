requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'app': '../tests/js/app',
        'data': '../tests/js/data'
    }
});

require(['wq/app', 'wq/map',
         'app/config', 'app/custom',
         'leaflet.draw'],
function(app, map, config, custom) {
    config.jqmInit = true;
    app.use(map);
    app.use(custom);
    app.init(config);
});
