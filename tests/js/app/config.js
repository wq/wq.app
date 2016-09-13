define(['data/config', 'data/templates'], function(wqConfig, templates) {
return {
    'transitions': {
        'default': 'slide'
    },
    'router': {
        'base_url': window.location.pathname.replace(/\/$/,'')
    },
    'pages': wqConfig.pages,
    'map': {
        'bounds': [[44.95, -93.30], [45.01, -93.24]]
    },
    'template': {
        'templates': templates,
        'defaults': {
            'version': '0.0.0'
        }
    },

    'debug': true,
    'loadMissingAsJson': true
};
});
