---
order: 12
---

Third Party Libraries
=====================

[wq.app/js]

**wq.app/js** contains a number of JavaScript libraries that are utilized by the main [wq.app modules], or are otherwise useful in general.  A couple of these these libraries have been patched with AMD wrappers.  Except where noted, the vendored libraries are equivalent to the official upstream version.  The included libraries are listed below.

Note that the actual wq.app modules are in the subfolder [wq.app/js/wq].  The purpose behind this directory organization is to minimize the need for an extensive AMD "paths" configuration.  This layout is heavily inspired by the [volojs] project template.

## Usage

To take advantage of this layout, you can make wq.app/js the `baseUrl` in your [AMD] project.  So, rather than:

```javascript
// Bad, don't do this
require.config({
    'baseUrl': 'my/js',
    'paths': {
        'jquery': 'path/to/jquery',
        'jquery.mobile': 'path/to/jquery.mobile',
        'leaflet': 'path/to/leaflet',
        'd3': 'path/to/d3',
        'wq': 'path/to/wq.app',
        // ...
    }
})
require(["main"], function(main) {
    main.go();
});
```

You can just do this:

```javascript
// baseUrl pointing to libs, with paths pointing to app code
require.config({
    'baseUrl': 'path/to/wq.app/js' // (or my/js/lib symlinked to wq.app/js)
    'paths': {
        'app': 'my/js/app',
    }
})
require(["app/main"], function(main) {
    main.go();
});
```

... and all of the included dependencies will be available by their usual names:

```javascript
// app/main.js
define(['d3', 'jquery', 'leaflet', ...],
function(d3, $, L)(
    function go() {
        // Do cool stuff here
    }
    return {'go': go};
});
```

## Library Versions

Library                 |  Version  |  Notes
------------------------| --------- | -------------------------------------------
[d3.js]                 |    3.5.5  |  
[es5-shim.js]           |    4.1.1  |  
[highlight.js]          |      8.5  |  `node tools/build.js -t amd -n bash css javascript markdown python scss xml`
[jquery]                |   1.11.3  |  
[jquery.mobile]         |    1.4.5  |  custom deps to ensure router loads first; `autoInitializePage: false`
[jquery.mobile.router]  |  443d352  |  
[jquery.validate]       |   1.13.1  |
[leaflet]               |    0.7.3  |  
[leaflet.draw]          |    0.2.4  |  wrapped as AMD module
[leaflet.markercluster] |    0.4.0  |  wrapped as AMD module; `cat *.css > leaflet.markercluster.css`
[localforage]           |    1.2.3  | [#381], [#241]
[marked]                |    0.3.3  |  
[mustache.js]           |    2.0.0  |  
[proj4]                 |    2.3.6  |  
[proj4leaflet]          |    0.7.1  |  
[rbush]                 |    1.4.0  |
[requirejs], [r.js]     |   2.1.17  |  r.js is in /build

[wq.app/js]:             https://github.com/wq/wq.app/blob/master/js
[wq.app modules]:        https://wq.io/docs/app
[wq.app/js/wq]:          https://github.com/wq/wq.app/blob/master/js/wq
[volojs]:                http://volojs.org
[AMD]:                   https://wq.io/docs/amd
[d3.js]:                 https://github.com/mbostock/d3
[es5-shim.js]:           https://github.com/es-shims/es5-shim
[highlight.js]:          https://github.com/isagalaev/highlight.js
[jquery]:                https://github.com/jquery/jquery
[jquery.mobile]:         https://github.com/jquery/jquery-mobile
[jquery.mobile.router]:  https://github.com/azicchetti/jquerymobile-router
[jquery.validate]:       https://github.com/jzaefferer/jquery-validation
[leaflet]:               https://github.com/Leaflet/Leaflet
[leaflet.draw]:          https://github.com/Leaflet/Leaflet.draw
[leaflet.markercluster]: https://github.com/Leaflet/Leaflet.markercluster
[localforage]:           https://github.com/mozilla/localForage
[#381]:                  https://github.com/mozilla/localForage/issues/381
[#241]:                  https://github.com/mozilla/localForage/issues/241
[marked]:                https://github.com/chjj/marked
[mustache.js]:           https://github.com/janl/mustache.js
[proj4]:                 https://github.com/proj4js/proj4js
[proj4leaflet]:          https://github.com/kartena/Proj4Leaflet
[rbush]:                 https://github.com/mourner/rbush
[requirejs]:             https://github.com/jrburke/requirejs
[r.js]:                  https://github.com/jrburke/r.js
