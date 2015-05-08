/*
 * wq.app 0.8.0-dev - wq/template.js
 * Convenience wrapper for mustache.js
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(["mustache"],
function(m) {

// Exported module object
var tmpl = {};

tmpl.init = function(config) {
    if (arguments.length > 1 ||
            (config && !config.templates && !config.defaults)) {
        throw "tmpl.init() now takes a single configuration argument";
    }
    _templates = config.templates || {};
    _partials = config.partials || config.templates.partials || {};
    _defaults = config.defaults || {};
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

// Internal variables
var _templates = {};
var _partials  = {};
var _defaults  = {};

return tmpl;

});
