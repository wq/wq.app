requirejs.config({
    'baseUrl': '../js',
    'paths': {
        'suite': '../tests/js/suite'
    }
});

requirejs(['suite/main']);
