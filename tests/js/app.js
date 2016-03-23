requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'app': '../tests/js/app',
        'data': '../tests/js/data'
    }
});

require(['wq/app', 'wq/map', 'wq/owl',
         'app/config', 'app/custom',
         'leaflet.draw'],
function(app, map, owl, config, custom) {
    config.jqmInit = true;
    app.use(map);
    app.use(owl);
    app.use(custom);
    app.init(config);
});
