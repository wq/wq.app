import m from 'mustache';

// Exported module object
var tmpl = {};

// Internal variables
var _templates = {};
var _partials = {};

tmpl.init = function(config) {
    _templates = config.templates || {};
    _partials = config.partials || _templates.partials || {};
    if (config.defaults) {
        throw new Error(
            'config.defaults is removed; use context plugin instead'
        );
    }
};

tmpl.setDefault = function() {
    throw new Error('tmpl.setDefault() is removed; use context plugin instead');
};

tmpl.render = function(template, context) {
    template = _templates[template] || template;
    return m.render(template, context, _partials);
};

export default tmpl;
