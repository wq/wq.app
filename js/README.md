Third party libraries
=====================

These are the dependencies of various wq.app modules as well as some other useful libraries.  Some of these have been patched as AMD modules to support better integration without shimming.

## Library versions

Library                 |  Version  |  Notes
------------------------| --------- | -------------------------------------------
[d3.js]                 |   3.3.10  |  wrapped as AMD module
[es5-shim.js]           |    2.1.0  |  
[highlight.js]          |      7.5  |  tools/build.py -n -tamd bash css javascript markdown python scss xml
[jquery]                |    1.9.1  |  
[jquery.mobile]         |    1.3.2  |  custom deps to ensure router loads first
[jquery.mobile.router]  |  443d352  |  
[jquery.validate]       |   1.11.1  |  wrapped as AMD module
[leaflet]               |      0.7  |  
[leaflet.markercluster] |  8ccd5a3  |  wrapped as AMD module
[marked]                |   0.2.10  |  
[mustache.js]           |    0.7.3  |  
[proj4]                 |    2.0.0  |  
[proj4leaflet]          |    0.7.0  |  
[requirejs], [r.js]     |    2.1.9  |  r.js is in /build

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
[requirejs]:             https://github.com/jrburke/requirejs
[r.js]:                  https://github.com/jrburke/r.js
