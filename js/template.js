/* template
 * Convenience wrapper for mustache.js
 * (c) 2012 S. Andrew Sheppard
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
    var context = {};
    for (var key in _defaults)
        context[key] = _defaults[key];
    for (var key in data)
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
