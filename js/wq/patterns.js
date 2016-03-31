/*
 * wq.app 1.0.0-dev - wq/patterns.js
 * wq/app.js plugin to handle dynamically adding nested forms
 * (c) 2016, S. Andrew Sheppard
 * https://wq.io/license
 */

define(['jquery', 'wq/template'], function($, tmpl) {

var patterns = {
    'name': 'patterns'
};

var _templates, _pageContext;

patterns.init = function(conf) {
    _templates = (
        conf && conf.templates ||
        this.app.config.template.templates
    );
};

patterns.context = function(context) {
    _pageContext = context;
};

patterns.run = function($page, routeInfo) {
    $page.find('button[data-wq-action=addattachment]').click(add);
    function add(evt) {
        var $button = $(evt.target),
            section = $button.data('wq-section'),
            count = $page.find('.section-' + section).length;
        patterns.addAttachment(routeInfo.page, section, count, $button);
    }
};

patterns.addAttachment = function(page, section, index, $button) {
    var template = _templates[page + '_edit'],
        pattern = '{{#' + section + '}}([\\s\\S]+){{/' + section + '}}',
        match, $attachment, context;
    if (!template) {
         return;
    }
    match = template.match(pattern);
    if (!match) {
        return;
    }

    context = {
        '@index': index
    };
    for (var key in _pageContext) {
        context[key.replace(section + '.', '')] = _pageContext[key];
    }
    $attachment = $(tmpl.render(match[1], context));
    $button.parents('li').before($attachment);
    $attachment.enhanceWithin();
    $button.parents('ul').listview('refresh');
};

return patterns;

});
