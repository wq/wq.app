/*
 * wq.app 1.0.0rc2 - wq/template.js
 * Render and inject Mustache templates
 * (c) 2012-2017, S. Andrew Sheppard
 * https://wq.io/license
 */

define(["mustache", "jquery", "jquery.mobile", "./console"],
function(m, $, jqm, console) {

// Exported module object
var tmpl = {};

// Internal variables
var _templates = {};
var _partials  = {};
var _defaults  = {};
var _debug;

tmpl.init = function(config) {
    if (arguments.length > 1 ||
            (config && !config.templates && !config.defaults)) {
        throw "tmpl.init() now takes a single configuration argument";
    }
    _templates = config.templates || {};
    _partials = config.partials || config.templates.partials || {};
    _defaults = config.defaults || {};
    _debug = config.debug || false;
};

tmpl.setDefault = function(key, value) {
    _defaults[key] = value;
};

tmpl.render = function(template, data) {
    var context = {}, key;
    for (key in _defaults) {
        context[key] = _defaults[key];
    }
    for (key in data) {
        context[key] = data[key];
    }

    template = _templates[template] || template;
    return m.render(template, context, _partials);
};

// Render page and inject it into DOM (replace existing page if it exists)
function inject(template, context, url, pageid) {
    var html  = tmpl.render(template, context);
    if (!html.match(/<div/)) {
        throw "No content found in template '" + template + "'!";
    }
    var title = html.split(/<\/?title>/)[1];
    var body  = html.split(/<\/?body[^>?]*>/)[1];
    if (body) {
        html = body;
    }
    var $page = $(html.trim());

    // Check for <div data-role=page>, in case it is not the only element in
    // the selection (due to an external footer or something)
    var $rolePage = $page.filter(":jqmData(role='page')");
    if ($rolePage.length > 0) {
        if (_debug && $rolePage.length != $page.length) {
            console.info(
                ($page.length - $rolePage.length) +
                " extra element(s) ignored."
            );
        }
        $page = $rolePage;
    }

    var role = $page.jqmData('role');
    var $oldpage;
    if (pageid) {
        if (pageid === true) {
            pageid = template + '-page';
        }
        $oldpage = $('#' + pageid);
    }
    if (!$oldpage || !$oldpage.length) {
        $oldpage = $(":jqmData(url='" + url + "')");
        if (pageid && $oldpage.attr('id') && $oldpage.attr('id') != pageid) {
            $oldpage = null;
        }
    }
    if ($oldpage && $oldpage.length) {
        $oldpage.remove();
    }
    if (role == 'popup' || role == 'panel') {
        $page.appendTo(jqm.activePage[0]);
        if (role == 'popup') {
            $page.popup();
        } else {
            $page.panel();
        }
        $page.trigger('create');
    } else {
        $page.attr("data-" + jqm.ns + "url", url);
        $page.attr("data-" + jqm.ns + "title", title);
        if (pageid) {
            $page.attr('id', pageid);
        }
        $page.appendTo(jqm.pageContainer);
        $page.page();
    }
    return $page;
}

if (window.MSApp && window.MSApp.execUnsafeLocalFunction) {
    tmpl.inject = function(template, context, url, pageid) {
        return window.MSApp.execUnsafeLocalFunction(function() {
            return inject(template, context, url, pageid);
        });
    };
} else {
    tmpl.inject = inject;
}

// Render template only once
tmpl.injectOnce = function(template, context, url, id) {
    if(!id) {
        id = template + "-page";
    }
    var $page = $('#' + id);
    if (!$page.length) {
        // Initial render, use context if available
        $page = tmpl.inject(template, context, url, id);
    } else {
        // Template was already rendered; ignore context but update URL
        // - it is up to the caller to update the DOM
        $page.attr("data-" + jqm.ns + "url", url);
        $page.jqmData("url", url);
    }
    return $page;
};

return tmpl;

});
