---
order: 9
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
[d3.js]                 |    3.4.1  |  
[es5-shim.js]           |    2.3.0  |  
[highlight.js]          |      8.0  |  `tools/build.py -n -tamd bash css javascript markdown python scss xml`
[jquery]                |   1.11.1  |  
[jquery.mobile]         |    1.4.5  |  custom deps to ensure router loads first
[jquery.mobile.router]  |  443d352  |  
[jquery.validate]       |   1.13.0  |
[leaflet]               |    0.7.2  |  
[leaflet.markercluster] |    0.4.0  |  wrapped as AMD module; `cat *.css > leaflet.markercluster.css`
[marked]                |    0.3.1  |  
[mustache.js]           |    0.8.1  |  
[proj4]                 |    2.1.0  |  
[proj4leaflet]          |    0.7.0  |  
[rbush]                 |      1.3  |
[requirejs], [r.js]     |   2.1.10  |  r.js is in /build

[wq.app/js]:             https://github.com/wq/wq.app/blob/master/js
[wq.app modules]:        https://wq.io/docs/app
[wq.app/js/wq]:          https://github.com/wq/wq.app/blob/master/js/wq
[volojs]:                http://volojs.org
[AMD]:                   https://wq.io/docs/amd
[d3.js]:                 https://github.com/mbostock/d3
[es5-shim.js]:           https://github.com/kriskowal/es5-shim
[highlight.js]:          https://github.com/isagalaev/highlight.js
[jquery]:                https://github.com/jquery/jquery
[jquery.mobile]:         https://github.com/jquery/jquery-mobile
[jquery.mobile.router]:  https://github.com/azicchetti/jquerymobile-router
[jquery.validate]:       https://github.com/jzaefferer/jquery-validation
[leaflet]:               https://github.com/Leaflet/Leaflet
[leaflet.markercluster]: https://github.com/Leaflet/Leaflet.markercluster
[marked]:                https://github.com/chjj/marked
[mustache.js]:           https://github.com/janl/mustache.js
[proj4]:                 https://github.com/proj4js/proj4js
[proj4leaflet]:          https://github.com/kartena/Proj4Leaflet
[rbush]:                 https://github.com/mourner/rbush
[requirejs]:             https://github.com/jrburke/requirejs
[r.js]:                  https://github.com/jrburke/r.js
