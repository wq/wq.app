requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'app': '../tests/js/app',
        'data': '../tests/js/data'
    }
});

require(['wq/app', 'wq/map', 'app/config'],
function(app, map, config) {
    app.init(config).then(function() {
        map.init(config.map);
        app.jqmInit();
    });
});
