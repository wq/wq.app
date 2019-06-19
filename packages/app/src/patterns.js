import tmpl from '@wq/template';

var patterns = {
    name: 'patterns'
};

var _templates, _pageContext, $;

patterns.init = function(conf) {
    _templates = (conf && conf.templates) || this.app.config.template.templates;
    $ = (conf && conf.jQuery) || window.jQuery;
};

patterns.context = function(context, routeInfo) {
    _pageContext = context;
    if (routeInfo.mode === 'edit' && routeInfo.variant === 'new') {
        return { new_attachment: true };
    }
};

patterns.run = function($page, routeInfo) {
    $page.find('button[data-wq-action=addattachment]').click(add);
    $page.on('click', 'button[data-wq-action=removeattachment]', remove);
    function add(evt) {
        var $button = $(evt.target),
            section = $button.data('wq-section'),
            count = $page.find('.section-' + section).length;
        patterns.addAttachment(
            routeInfo.page,
            section,
            count,
            $button,
            routeInfo.mode
        );
    }
    function remove(evt) {
        var $button = $(evt.target),
            section = $button.data('wq-section'),
            $row = $button.parents('.section-' + section);
        $row.remove();
    }
};

function addAttachment(page, section, index, $button, mode) {
    var template = _templates[page + '_' + (mode ? mode : 'edit')],
        pattern = '{{#' + section + '}}([\\s\\S]+){{/' + section + '}}',
        match,
        $attachment,
        context;
    if (!template) {
        return;
    }
    match = template.match(pattern);
    if (!match) {
        return;
    }

    context = {
        '@index': index,
        new_attachment: true
    };
    for (var key in _pageContext) {
        context[key.replace(section + '.', '')] = _pageContext[key];
    }
    $attachment = $(tmpl.render(match[1], context));
    if ($attachment.is('tr')) {
        $button.parents('tr').before($attachment);
        $attachment.enhanceWithin();
    } else {
        $button.parents('li').before($attachment);
        $attachment.enhanceWithin();
        $button.parents('ul').listview('refresh');
    }
}

if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
    patterns.addAttachment = function(page, section, index, $button, mode) {
        window.MSApp.execUnsafeLocalFunction(function() {
            addAttachment(page, section, index, $button, mode);
        });
    };
} else {
    patterns.addAttachment = addAttachment;
}

export default patterns;
