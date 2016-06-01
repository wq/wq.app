define({
    'context': function(context, routeInfo) {
        return Promise.resolve({
            'context_page_url': context.page_config.url,
            'route_info_mode': routeInfo.mode,
            'route_info_parent_page': routeInfo.parent_page
        });
    }
});
