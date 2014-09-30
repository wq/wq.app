requirejs.config({
    'baseUrl': '../../js',
    'paths': {
        'app': '../tests/js/app'
    }
});

var baseurl = window.location.pathname.replace(/\/$/,'');

require(['wq/app', 'wq/map', 'wq/owl','app/config', 'app/templates'],
function(app, map, owl, config, templates) {
    app.init(config, templates, baseurl);
    map.init(config.map);
    owl.init();
    app.jqmInit();
});
