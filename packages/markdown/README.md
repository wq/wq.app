@wq/markdown
==============

[@wq/markdown]

**@wq/markdown** is a [@wq/app plugin] that adds Markdown and syntax highlighting capabilities to the template rendering [context].

## Installation

### wq.app for PyPI

```bash
python3 -m venv venv      # create virtual env (if needed)
. venv/bin/activate       # activate virtual env
python3 -m pip install wq # install wq framework (wq.app, wq.db, etc.)
# pip install wq.app      # install wq.app only
```

### @wq/app for npm

```bash
npm install @wq/markdown
```

## API

By default, @wq/markdown looks for a `markdown` property on the current context and outputs an `html` property that can be rendered into the template as `{{{html}}}`.  @wq/markdown can optionally be configured to look for a different `input` context variable or a different `output` variable.  It can also be configured with a custom `postProcess` function before returning the final HTML.

### wq.app for PyPI

```javascript
// myapp/main.js
define(['wq/app', 'wq/markdown', './config'],
function(app, md, config) {

// In myapp/config.js:
// config.markdown = {'input': 'markdown', 'output': 'html'};
// config.markdown.postProcess = function(html) { return html };

app.use(md);
app.init(config).then(function() {
    app.jqmInit();
    app.prefetchAll();
});

});
```

### @wq/app for npm

```javascript
// src/index.js
import app from '@wq/app';
import md from '@wq/markdown';
import config from './config';

// In src/config.js:
// config.markdown = {'input': 'markdown', 'output': 'html'};
// config.markdown.postProcess = function(html) { return html };

app.use(md);
app.init(config).then(function() {
    app.jqmInit();
    app.prefetchAll();
});
```

@wq/markdown uses [marked] for Markdown processing and [highlight.js] for code syntax highlighting.  The parsers for Bash, CSS, JavaScript, Markdown, Python, SCSS, and XML are included by default.

[@wq/markdown]: https://github.com/wq/wq.app/blob/master/packages/markdown
[@wq/app plugin]: https://wq.io/docs/app-js
[context]: https://wq.io/docs/router-js
[marked]: https://marked.js.org/
[highlight.js]: https://highlightjs.org/
