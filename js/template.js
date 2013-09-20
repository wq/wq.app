/*
 * wq.app 0.4.1 - template.js
 * Convenience wrapper for mustache.js
 * (c) 2012-2013, S. Andrew Sheppard
 * http://wq.io/license
 */

define(["./lib/mustache"],
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
