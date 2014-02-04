[![wq.app](https://raw.github.com/wq/wq/master/images/256/wq.app.png)](http://wq.io/wq.app)

[wq.app](http://wq.io/wq.app) is a suite of Javascript modules and related assets, created to facilitate the rapid deployment of offline-cabable HTML5 mobile and desktop data collection apps for **crowdsourcing**, **citizen science**, and **volunteered geographic information**, as well as professional **field data collection**.  wq.app is the client component of the [wq framework], and can be used with any REST service as a backend.  In particular, when combined with a Mustache-capable REST service like [wq.db], wq.app can be used to create **responsive, progressively enhanced** websites / apps, that can selectively render individual application screens on the server *or* on the client depending on project needs, network connectivity, and `localStorage` availability.

## Getting Started

```bash
pip install wq.app
# Or, if using together with wq.db
pip install wq
```

See [the documentation] for more information.

## Features

wq.app's [JavaScript modules] are built on [a number of libraries] including [RequireJS], [jQuery Mobile], [Leaflet], [d3], and [Mustache.js].  wq.app extends these libraries with:

 - [wq/app.js], a high-level application controller that combines `store.js` and `pages.js` into a full configuration-driven CRUD client (intended for use with [wq.db]'s [app.py])
 - [wq/chart.js], configurable d3-based reusable charts, including time series and box plots
 - [wq/locate.js], Leaflet-powered utilities for requesting and displaying the user's location
 - [wq/map.js], Leaflet integration for showing maps on app.js pages that contain geometry (e.g. GeoJSON or simple lat/long)
 - [wq/pages.js], a PJAX-style `pushState` URL router, template renderer, and page injector
 - [wq/pandas.js], a tool for loading Pandas DataFrames via CSV
 - [wq/store.js], a robust `localStorage`-cached JSON REST client (with indexing and filtering capabilities for object lists)
 - and a number of [other useful utilities]

To facilitate compact deployment, wq.app provides a Python-based [build process] for compiling wq apps: inlining templates, optimizing code (via [r.js]), and generating an application cache manifest.  wq.app also includes [jquery-mobile.scss], a SASS/SCSS stylesheet for generating custom jQuery Mobile themes.

 [wq framework]: http://wq.io
 [recommended project layout]: https://github.com/wq/django-wq-template
 [a number of libraries]: http://wq.io/docs/third-party

 [the documentation]: http://wq.io/docs/
 [JavaScript modules]: http://wq.io/docs/app
 [RequireJS]: http://requirejs.org
 [r.js]: https://github.com/jrburke/r.js
 [jQuery Mobile]: http://jquerymobile.com
 [Leaflet]: http://leafletjs.com
 [d3]: http://d3js.org
 [Mustache.js]: https://mustache.github.com/
 
 [wq/app.js]: http://wq.io/docs/app-js
 [wq/chart.js]: http://wq.io/docs/chart-js
 [wq/pages.js]: http://wq.io/docs/pages-js
 [wq/pandas.js]: http://wq.io/docs/pandas-js
 [wq/locate.js]: http://wq.io/docs/locate-js
 [wq/map.js]: http://wq.io/docs/map-js
 [wq/store.js]: http://wq.io/docs/store-js
 [other useful utilities]: http://wq.io/docs/sup
 
 
 [jquery-mobile.scss]: http://wq.io/docs/jquery-mobile-scss-themes
 [build process]: http://wq.io/docs/build
 
 [wq.db]: http://wq.io/wq.db
 [app.py]: http://wq.io/docs/app.py
