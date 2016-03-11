requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'suite': '../tests/js/suite',
        'data': '../tests/js/data'
    }
});

requirejs(['suite/main']);
