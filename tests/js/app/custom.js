define({
    'context': function(context) {
        return Promise.resolve({
            'test_async': context.page_config.url
        });
    }
});
