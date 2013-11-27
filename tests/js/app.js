requirejs.config({
    'baseUrl': '../../js',
    'paths': {
        'app': '../tests/js/app'
    }
});

var baseurl = window.location.pathname.replace(/\/$/,'');

require(['wq/app', 'wq/map', 'app/config', 'app/templates'],
function(app, map, config, templates) {
    app.init(config, templates, baseurl);
    map.init(config.map);
});
