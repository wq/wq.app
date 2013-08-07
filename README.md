<img src="https://raw.github.com/wq/wq/master/images/512/wq.app.png"
  width="256" height="256"
  alt="wq.app">

**wq.app** is a suite of Javascript modules and related assets, created to facilitate the rapid deployment of offline-cabable HTML5 mobile and desktop data collection apps for crowdsourcing, citizen science, and volunteered geographic information, as well as professional field data collection.  wq.app is the client component of the [wq framework], and can be used with any REST service.  When combined with a Mustache-capable REST service like [wq.db], wq.app can be used to create progressively enhanced websites / apps, that can selectively render individual application screens on the server *or* on the client depending on project needs, network connectivity, and `localStorage` availability.

## Project Layout

**wq.app/js** is built on [a number of libraries] including [RequireJS], [jQuery Mobile], [Leaflet], [d3], and [Mustache.js].  wq.app extends these libraries with:

 - [store.js], a robust `localStorage`-cached JSON REST client (with a lightweight implementation of models and collections)
 - [pages.js], a PJAX-style `pushState` URL router, template renderer, and page injector
 - [app.js], a high-level application controller that combines `store.js` and `pages.js` into a full configuration-driven CRUD client (intended for use with [wq.db]'s [app.py])
 - [map.js], Leaflet integration for app.js models that contain geometry (GeoJSON or simple lat/long)
 - [chart.js], configurable d3-based time series and contour plots
 - and a number of other useful utilities

When using wq.app in the [recommended project layout], `wq.app/js` should be mapped to `myproject/app/js/wq`.

**wq.app/css** includes the default stylesheets packaged with jQuery Mobile and Leaflet.  When using wq.app in the [recommended project layout], `wq.app/css` should be mapped to `myproject/app/css/wq`.

**wq.app/scss** provides a SASS/SCSS stylesheet for use with Compass, with appropriate macros for generating custom jQuery Mobile themes.

**wq.app/util** provides a Python-based build process for compiling wq apps: inlining templates, optimizing code (via r.js), and generating an application cache manifest.

wq.app does not currently include any default HTML templates, leaving this as an exercise for the project implementer.

 [wq framework]: http://wq.io
 [recommended project layout]: https://github.com/wq/django-wq-template
 [a number of libraries]: https://github.com/wq/wq.app/tree/master/js/lib#readme

 [RequireJS]: http://requirejs.org
 [jQuery Mobile]: http://jquerymobile.com
 [Leaflet]: http://leafletjs.com
 [d3]: http://d3js.org
 [Mustache.js]: https://mustache.github.com/
 
 [store.js]: https://github.com/wq/wq.app/blob/master/js/store.js
 [pages.js]: https://github.com/wq/wq.app/blob/master/js/pages.js
 [app.js]: https://github.com/wq/wq.app/blob/master/js/app.js
 [map.js]: https://github.com/wq/wq.app/blob/master/js/map.js
 [chart.js]: https://github.com/wq/wq.app/blob/master/js/chart.js
 
 [wq.db]: https://github.com/wq/wq.db
 [app.py]: https://github.com/wq/wq.db/blob/master/rest/app.py
