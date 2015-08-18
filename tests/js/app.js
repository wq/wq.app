requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'app': '../tests/js/app',
        'data': '../tests/js/data'
    }
});

require(['wq/app', 'wq/map', 'app/config', 'leaflet.draw'],
function(app, map, config) {
    config.jqmInit = true;
    app.use(map);
    app.init(config);
});
