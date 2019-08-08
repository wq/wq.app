@wq/template
==============

[@wq/template]

**@wq/template** is a low-level [wq.app] module providing a simple API wrapper around **Mustache.js**, adding a way to cache template definitions and insert rendered templates into the DOM.  @wq/template is internally used by [@wq/router] to render pages for [@wq/app], and does not usually need to be imported directly.  That said, it can be a useful utility for easily rendering arbitrary templated strings.  

### Installation

#### wq.app for PyPI

```bash
python3 -m venv venv      # create virtual env (if needed)
. venv/bin/activate       # activate virtual env
python3 -m pip install wq # install wq framework (wq.app, wq.db, etc.)
# pip install wq.app      # install wq.app only
```

#### @wq/app for npm

```bash
npm install @wq/app        # install all @wq/app deps including @wq/template
# npm install @wq/template # install only @wq/template and deps
```


### API

@wq/template is typically imported  as `tmpl`, though any local variable name can be used.  `tmpl` provides an `init()` function which accepts a configuration object that defines a set of templates and template partials.  `tmpl.setDefault(name, value)` can be used after initialization to assign default context variables, though this usage is deprecated in favor of [@wq/app context plugins][@wq/app].  `tmpl.render(template, context)` renders a template with the given context.  `template` can be either the name of an existing template or the content of a new template.


#### wq.app for PyPI

```javascript
define(['wq/template', ...], function(tmpl, ...) {
```

#### @wq/app for npm
```javascript
import tmpl from '@wq/template';
```

```javascript
var config = {
    'templates': {
        'example': '{{name}} {{>example_partial}}',
        'item_detail': '<html><body><div data-role=page>...',
    },
    'partials': {
        'example_partial': "Example"
    }
};
tmpl.init(config);
tmpl.render("example", {'name': 'First'});  // Result: First Example
tmpl.render("Another {{>example_partial}}", {'name': 'Another'}); // Result: Another Example
var $page = tmpl.inject("item_detail", {"id": 123, ...}); 
```

> Note: Rather than writing out the configuration object by hand, you can use the [wq collectjson] command to load HTML files from a folder.

[@wq/template]: https://github.com/wq/wq.app/blob/master/packages/template
[wq.app]: https://wq.io/wq.app
[@wq/router]: https://wq.io/docs/router-js
[wq collectjson]: https://wq.io/docs/collectjson
[template context processors]: https://docs.djangoproject.com/en/1.8/ref/templates/api/#subclassing-context-requestcontext
[@wq/app]: https://wq.io/docs/app-js
