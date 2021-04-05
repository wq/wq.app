@wq/jquery-mobile
======================

@wq/jquery-mobile is a [jQuery Mobile](https://jquerymobile.com) renderer for [wq.app].  The renderer includes a Mustache-based template engine for use with [@wq/app] and [@wq/router].

> Note: This renderer is only recommended for projects migrating from an older version of wq.app.  New projects should use the [@wq/material] renderer instead.

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
npm install @wq/app @wq/jquery-mobile
```

### API

@wq/jquery-mobile can be configured via the 'jqmrenderer' config key.

#### wq.app for PyPI

```javascript
define(['wq/app', 'wq/jquery-mobile', 'config'],
function(app, jqm, config, ...) {
    // config.jqmrenderer = {'templates': ..., 'partials': ...};
    app.use(jqm);
    app.init(config);
});
```

#### @wq/app for npm
```javascript
import app from '@wq/app';
import jqm from '@wq/jquery-mobile';
import config from './config';
// config.jqmrenderer = {'templates': ..., 'partials': ...};

app.use(jqm);
app.init(config);
```

The configuration object should have the following format:
```javascript
config.jqmrenderer = {
    // Required
    templates: {
        'example': '{{name}} {{>example_partial}}',
        'item_detail': '<html><body><div data-role=page>...',
    },
    partials: {
        'example_partial': "Example"
    },

    // Optional
    injectOnce: false,
    debug: false,
    transitions: {
	default: 'none',
	dialog: 'none',
	maxwidth: 800
    }
};
```

> Note: Rather than writing out the template object by hand, you can use the [wq collectjson] command to load HTML files from a folder.

[wq.app]: https://wq.io/wq.app/
[@wq/app]: https://wq.io/@wq/app
[@wq/router]: https://wq.io/@wq/router
[@wq/material]: https://wq.io/@wq/material
[wq collectjson]: https://wq.io/wq.build/collectjson
