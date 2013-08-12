requirejs.config({
    'paths': {
        'wq': '../../js'
    }
});

var baseurl = window.location.pathname.replace(/\/$/,'');

require(['wq/app', 'wq/map', './config', './templates'],
function(app, map, config, templates) {
    app.init(config, templates, baseurl);
    map.init(config.map);
});
