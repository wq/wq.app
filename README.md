[![wq.app](https://raw.github.com/wq/wq/master/images/256/wq.app.png)](https://wq.io/wq.app)

[wq.app](https://wq.io/wq.app) is a suite of Javascript modules and related assets, created to facilitate the rapid deployment of offline-cabable HTML5 mobile and desktop data collection apps for **crowdsourcing**, **citizen science**, and **volunteered geographic information**, as well as professional **field data collection**.  wq.app is the client component of the [wq framework], and can be used with any REST service as a backend.  In particular, when combined with a Mustache-capable REST service like [wq.db], wq.app can be used to create **responsive, progressively enhanced** websites / apps, that can selectively render individual application screens [on the server or on the client] depending on project needs, network connectivity, and offline storage availability.



[![Latest PyPI Release](https://img.shields.io/pypi/v/wq.app.svg)](https://pypi.org/project/wq.app)
[![Release Notes](https://img.shields.io/github/release/wq/wq.app.svg)](https://github.com/wq/wq.app/releases)
[![Documentation](https://img.shields.io/badge/Docs-1.0-blue.svg)](https://wq.io/wq.app)
[![License](https://img.shields.io/pypi/l/wq.app.svg)](https://wq.io/license)
[![GitHub Stars](https://img.shields.io/github/stars/wq/wq.app.svg)](https://github.com/wq/wq.app/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/wq/wq.app.svg)](https://github.com/wq/wq.app/network)
[![GitHub Issues](https://img.shields.io/github/issues/wq/wq.app.svg)](https://github.com/wq/wq.app/issues)

[![Travis Build Status](https://img.shields.io/travis/wq/wq.app/master.svg)](https://travis-ci.org/wq/wq.app)

## Getting Started

```bash
# Recommended: create virtual environment
# python3 -m venv venv
# . venv/bin/activate

# Install entire wq suite (recommended)
pip install wq

# Install only wq.app
pip install wq.app
```

See [the documentation] for more information.

## Features

wq.app's [JavaScript modules] are built on [a number of libraries] including [RequireJS], [jQuery Mobile], [Leaflet], [d3], and [Mustache.js].  wq.app extends these libraries with:

 * [wq/app.js], a high-level application controller and configuration-driven CRUD client (optimized for use with [wq.db.rest])
 * [wq/model.js], a lightweight implementation of models / collections
 * [wq/outbox.js], an offline queue of `<form>` submissions for later synchronization
 * and a number of [other useful utilities]

wq/app.js can be extended with a number of [plugins] to integrate [Leaflet-powered maps][wq/map.js], [d3.js-powered charts][wq/chartapp.js], and other enhanced functionality for project-specific use cases.  wq.app comes bundled with all of the required [third-party JavaScript libraries][third-party].  To facilitate compact deployment, wq.app provides a Python-based [build process] for compiling wq apps: inlining templates, optimizing code (via [r.js]), and generating a native application package (via [PhoneGap Build]).  wq.app also includes [jquery-mobile.scss], a SASS/SCSS stylesheet for generating custom jQuery Mobile themes.

See the notes in [Getting Started] for more information about setting up a project layout that utilizes wq.app and/or its bundled third-party libraries.

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
 [PhoneGap Build]: https://build.phonegap.com/
 
 [wq/app.js]: https://wq.io/docs/app-js
 [wq/chart.js]: https://wq.io/docs/chart-js
 [wq/map.js]: https://wq.io/docs/map-js
 [wq/model.js]: https://wq.io/docs/model-js
 [wq/outbox.js]: https://wq.io/docs/outbox-js
 [other useful utilities]: https://wq.io/docs/app
 
 
 [jquery-mobile.scss]: https://wq.io/docs/jquery-mobile-scss-themes
 [build process]: https://wq.io/docs/build
 
 [wq.db]: https://wq.io/wq.db
 [wq.db.rest]: https://wq.io/docs/about-rest
 [on the server or on the client]: https://wq.io/docs/templates

 [plugins]: https://wq.io/docs/app-plugins
 [wq/chartapp.js]: https://wq.io/docs/chartapp-js
 [third-party]: https://wq.io/docs/third-party
 [Getting Started]: https://wq.io/docs/setup
