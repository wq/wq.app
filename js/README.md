Third party libraries
=====================

This directory contains the dependencies of various wq.app modules, as well as some other useful libraries.  An ever-shrinking minority of these have been patched to add missing AMD definitions.  Except where noted, the vendored libraries are equivalent to the official upstream version.

Note that the actual [wq.app modules] are in the subfolder [lib/wq].  The purpose behind this organization is to minimize paths configuration by allowing this js folder to be used as the `baseUrl` in an AMD project.  So, rather than:

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
```

Users of these libraries can just do this:

```javascript
// my/js/app.js
require.config({
    'baseUrl': 'path/to/wq.app/js' // (or my/js/lib symlinked to wq.app/js)
    'paths': {
        'app': 'my/js/app',
    }
})
```

This layout is heavily inspired by the [volojs] project template.

## Library versions

Library                 |  Version  |  Notes
------------------------| --------- | -------------------------------------------
[d3.js]                 |    3.4.1  |  
[es5-shim.js]           |    2.3.0  |  
[highlight.js]          |      8.0  |  `tools/build.py -n -tamd bash css javascript markdown python scss xml`
[jquery]                |    1.9.1  |  
[jquery.mobile]         |    1.3.2  |  custom deps to ensure router loads first
[jquery.mobile.router]  |  443d352  |  
[jquery.validate]       |   1.11.1  |  wrapped as AMD module
[leaflet]               |    0.7.2  |  
[leaflet.markercluster] |    0.4.0  |  wrapped as AMD module; `cat *.css > leaflet.markercluster.css`
[marked]                |    0.3.1  |  
[mustache.js]           |    0.8.1  |  
[proj4]                 |    2.1.0  |  
[proj4leaflet]          |    0.7.0  |  
[rbush]                 |      1.3  |
[requirejs], [r.js]     |   2.1.10  |  r.js is in /build

[wq.app modules]:        http://wq.io/docs/app
[lib/wq]:                https://github.com/wq/wq.app/tree/master/js/wq
[volojs]:                http://volojs.org
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
