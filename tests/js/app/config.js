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
        'zoom': 13,
        'center': [44.98, -93.27]
//      'owl': true
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
