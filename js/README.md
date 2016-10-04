---
order: 13
---

Third Party Libraries
=====================

[wq.app/js]

**wq.app/js** contains a number of JavaScript libraries that are dependencies of the [wq.app modules].  Note that the actual wq.app modules ([wq/app.js], [wq/map.js], etc.) are located in the subfolder [wq.app/js/wq].  In the [default project layout], `wq.app/js` is linked to `[my_project]/app/js/lib`, and `wq.app/js/wq` to `[my_project]/app/js/lib/wq`.  The goal is to make this folder the [RequireJS] `baseUrl`, minimizing the need for an extensive `paths` configuration.

The included libraries are listed below.  Except where noted, the vendored libraries are equivalent to the official upstream version.  A couple of these these libraries have been patched with [AMD] wrappers.

## Library Versions

Library                 |  Version  |  Notes
------------------------| --------- | -------------------------------------------
[d3.js]                 |    4.2.6  |  
[esri-leaflet]          |    1.0.2  |
[highlight.js]          |    9.7.0  |  `node tools/build.js -t amd -n bash css javascript markdown python scss xml`
[jquery]                |   1.11.3  |  
[jquery.mobile]         |    1.4.5  |  custom deps to ensure router loads first; `autoInitializePage: false`
[jquery.mobile.router]  |  443d352  |  
[jquery.validate]       |   1.13.1  |
[json-forms]            |  d22b545  |  wrapped as AMD module; split JSONEncode into two functions
[leaflet]               |    1.0.1  |
[leaflet.draw]          |  31c7738  |  [#596]; wrapped as AMD module
[leaflet.markercluster] |    0.4.0  |  wrapped as AMD module; `cat *.css > leaflet.markercluster.css`
[localforage]           |  e3f2218  | [#603]
[memoryStorageDriver]   |  a2396b3  |
[marked]                |    0.3.6  |  
[mustache.js]           |    2.2.1  |  
[proj4]                 |    2.3.6  |  
[proj4leaflet]          |    0.7.1  |  
[requirejs], [r.js]     |    2.3.2  |  r.js is in /build
[qunit]                 |    2.0.1  |

[wq.app/js]:             https://github.com/wq/wq.app/blob/master/js
[wq.app modules]:        https://wq.io/docs/app
[wq.app/js/wq]:          https://github.com/wq/wq.app/blob/master/js/wq
[AMD]:                   https://wq.io/docs/amd
[d3.js]:                 https://github.com/mbostock/d3
[esri-leaflet]:          http://esri.github.io/esri-leaflet
[highlight.js]:          https://github.com/isagalaev/highlight.js
[jquery]:                https://github.com/jquery/jquery
[jquery.mobile]:         https://github.com/jquery/jquery-mobile
[jquery.mobile.router]:  https://github.com/azicchetti/jquerymobile-router
[jquery.validate]:       https://github.com/jzaefferer/jquery-validation
[json-forms]:            https://github.com/cezary/JSONForms
[leaflet]:               https://github.com/Leaflet/Leaflet
[leaflet.draw]:          https://github.com/Leaflet/Leaflet.draw
[#596]:                  https://github.com/Leaflet/Leaflet.draw/pull/596
[leaflet.markercluster]: https://github.com/Leaflet/Leaflet.markercluster
[localforage]:           https://github.com/localForage/localForage
[memoryStorageDriver]:   https://github.com/localForage/localForage-memoryStorageDriver
[#603]:                  https://github.com/localForage/localForage/pull/603
[marked]:                https://github.com/chjj/marked
[mustache.js]:           https://github.com/janl/mustache.js
[proj4]:                 https://github.com/proj4js/proj4js
[proj4leaflet]:          https://github.com/kartena/Proj4Leaflet
[requirejs]:             http://requirejs.org
[r.js]:                  https://github.com/jrburke/r.js
[qunit]:                 https://qunitjs.com/
[default project layout]: https://github.com/wq/wq-django-template
[wq/app.js]:             https://wq.io/docs/app-js
[wq/map.js]:             https://wq.io/docs/map-js
