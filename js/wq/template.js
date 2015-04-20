/*
 * wq.app 0.7.4 - wq/template.js
 * Convenience wrapper for mustache.js
 * (c) 2012-2015, S. Andrew Sheppard
 * https://wq.io/license
 */

define(["mustache"],
function(m) {

// Exported module object
var tmpl = {};

tmpl.init = function(templates, partials, defaults) {
    if (templates) _templates = templates;
    if (partials)  _partials  = partials;
    if (defaults)  _defaults  = defaults;
};

tmpl.setDefault = function(key, value) {
    _defaults[key] = value;
};

tmpl.render = function(template, data) {
    var context = {}, key;
    for (key in _defaults)
        context[key] = _defaults[key];
    for (key in data)
        context[key] = data[key];

    template = _templates[template] || template;
    return m.render(template, context, _partials);
};

// Internal variables
var _templates = {};
var _partials  = {};
var _defaults  = {};

return tmpl;

});
