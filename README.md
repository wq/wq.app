[![wq.app](https://raw.github.com/wq/wq/master/images/256/wq.app.png)](https://wq.io/wq.app)

[wq.app](https://wq.io/wq.app) is a suite of Javascript modules and related assets, created to facilitate the rapid deployment of offline-cabable HTML5 mobile and desktop data collection apps for **crowdsourcing**, **citizen science**, and **volunteered geographic information**, as well as professional **field data collection**.  wq.app is the client component of the [wq framework], and can be used with any REST service as a backend.  In particular, when combined with a Mustache-capable REST service like [wq.db], wq.app can be used to create **responsive, progressively enhanced** websites / apps, that can selectively render individual application screens [on the server or on the client] depending on project needs, network connectivity, and `localStorage` availability.

[**Release Notes**](https://github.com/wq/wq.app/releases) | [**Installation**](https://wq.io/docs/setup) | [**Documentation**](https://wq.io/wq.app) | [**Issue Tracker**](https://github.com/wq/wq.app/issues)

[![PyPI Package](https://pypip.in/version/wq.app/badge.svg?style=flat)](https://pypi.python.org/pypi/wq.app)

## Getting Started

```bash
pip3 install wq.app
# Or, if using together with wq.db
pip3 install wq
```

See [the documentation] for more information.

## Features

wq.app's [JavaScript modules] are built on [a number of libraries] including [RequireJS], [jQuery Mobile], [Leaflet], [d3], and [Mustache.js].  wq.app extends these libraries with:

 * [wq/app.js], a high-level application controller that combines **wq/store.js** and **wq/pages.js** into a full configuration-driven CRUD client (optimized for use with [wq.db.rest])
 * [wq/chart.js], configurable d3-based reusable charts, including time series and boxplots
 * [wq/locate.js], utilities for requesting and displaying the user's location
 * [wq/map.js], Leaflet integration for **wq/app.js** pages that contain geometry (loaded via GeoJSON)
 * [wq/router.js], a PJAX-style pushState URL router
 * [wq/template.js]: A Mustache template renderer and page injector
 * [wq/pandas.js], a utility for loading and parsing CSV generated by Django REST Pandas.
 * [wq/store.js], a robust `localStorage`-cached JSON REST client (with a lightweight implementation of models / collections)
 * and a number of [other useful utilities]

To facilitate compact deployment, wq.app provides a Python-based [build process] for compiling wq apps: inlining templates, optimizing code (via [r.js]), and generating an application cache manifest.  wq.app also includes [jquery-mobile.scss], a SASS/SCSS stylesheet for generating custom jQuery Mobile themes.

 [wq framework]: https://wq.io
 [recommended project layout]: https://github.com/wq/django-wq-template
 [a number of libraries]: https://wq.io/docs/third-party

 [the documentation]: https://wq.io/docs/setup
 [JavaScript modules]: https://wq.io/docs/app
 [RequireJS]: http://requirejs.org
 [r.js]: https://github.com/jrburke/r.js
 [jQuery Mobile]: http://jquerymobile.com
 [Leaflet]: http://leafletjs.com
 [d3]: http://d3js.org
 [Mustache.js]: https://mustache.github.com/
 
 [wq/app.js]: https://wq.io/docs/app-js
 [wq/chart.js]: https://wq.io/docs/chart-js
 [wq/router.js]: https://wq.io/docs/router-js
 [wq/template.js]: https://wq.io/docs/template-js
 [wq/pandas.js]: https://wq.io/docs/pandas-js
 [wq/locate.js]: https://wq.io/docs/locate-js
 [wq/map.js]: https://wq.io/docs/map-js
 [wq/store.js]: https://wq.io/docs/store-js
 [other useful utilities]: https://wq.io/docs/other-modules
 
 
 [jquery-mobile.scss]: https://wq.io/docs/jquery-mobile-scss-themes
 [build process]: https://wq.io/docs/build
 
 [wq.db]: https://wq.io/wq.db
 [wq.db.rest]: https://wq.io/docs/about-rest
 [on the server or on the client]: https://wq.io/docs/templates
