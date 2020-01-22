[![wq.app](https://raw.github.com/wq/wq/master/images/256/wq.app.png)](https://wq.io/wq.app)

[wq.app](https://wq.io/wq.app) is a suite of Javascript modules and related assets, created to facilitate the rapid deployment of offline-cabable HTML5 mobile and desktop data collection apps for **crowdsourcing**, **citizen science**, and **volunteered geographic information**, as well as professional **field data collection**.  wq.app is the client component of the [wq framework], and can be used with any REST service as a backend.  In particular, when combined with a Mustache-capable REST service like [wq.db], wq.app can be used to create **responsive, progressively enhanced** websites / apps, that can selectively render individual application screens [on the server or on the client] depending on project needs, network connectivity, and offline storage availability.

[![Latest PyPI Release](https://img.shields.io/pypi/v/wq.app.svg)](https://pypi.org/project/wq.app)
[![Release Notes](https://img.shields.io/github/release/wq/wq.app.svg)](https://github.com/wq/wq.app/releases)
[![Documentation](https://img.shields.io/badge/Docs-1.2-blue.svg)](https://wq.io/wq.app)
[![License](https://img.shields.io/pypi/l/wq.app.svg)](https://wq.io/license)
[![GitHub Stars](https://img.shields.io/github/stars/wq/wq.app.svg)](https://github.com/wq/wq.app/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/wq/wq.app.svg)](https://github.com/wq/wq.app/network)
[![GitHub Issues](https://img.shields.io/github/issues/wq/wq.app.svg)](https://github.com/wq/wq.app/issues)

#### Latest Build

[![Travis Build Status](https://img.shields.io/travis/wq/wq.app/master.svg)](https://travis-ci.org/wq/wq.app)
[![Python Wheel](https://img.shields.io/bintray/v/wq/wq.app/wq.app.svg)](https://bintray.com/wq/wq.app/wq.app/_latestVersion)

## Getting Started

```bash
# Recommended: create virtual environment
# python3 -m venv venv
# . venv/bin/activate

# Install entire wq suite (recommended)
python3 -m pip install wq

# Install only wq.app
python3 -m pip install wq.app
```

See [the documentation] for more information.

## Features

wq.app's [JavaScript modules] are built on a number of libraries including [jQuery Mobile], [Leaflet], and [Mustache.js].  wq.app extends these libraries with:

 * [@wq/app], a high-level application controller and configuration-driven CRUD client (optimized for use with [wq.db.rest])
 * [@wq/model], a lightweight implementation of models / collections
 * [@wq/outbox], an offline queue of `<form>` submissions for later synchronization
 * and a number of other useful utilities

@wq/app can be extended with a number of plugins such as the Leaflet-powered [@wq/map].  wq.app comes bundled with all of the required third-party JavaScript libraries.  To facilitate compact deployment, wq.app provides a Python-based [build process] for compiling wq apps: inlining templates, optimizing code (via [r.js]), and generating a native application package (via [PhoneGap Build]).

See the notes in [Getting Started] for more information about setting up a project layout that utilizes wq.app and its bundled JavaScript libraries.

 [wq framework]: https://wq.io
 [recommended project layout]: https://github.com/wq/django-wq-template

 [the documentation]: https://wq.io/docs/setup
 [JavaScript modules]: https://wq.io/docs/?chapter_id=app
 [RequireJS]: http://requirejs.org
 [r.js]: https://github.com/jrburke/r.js
 [jQuery Mobile]: http://jquerymobile.com
 [Leaflet]: http://leafletjs.com
 [Mustache.js]: https://mustache.github.com/
 [PhoneGap Build]: https://build.phonegap.com/
 
 [@wq/app]: https://wq.io/docs/app-js
 [@wq/map]: https://wq.io/docs/map-js
 [@wq/model]: https://wq.io/docs/model-js
 [@wq/outbox]: https://wq.io/docs/outbox-js 
 
 [jquery-mobile.scss]: https://wq.io/docs/jquery-mobile-scss-themes
 [build process]: https://wq.io/docs/build
 
 [wq.db]: https://wq.io/wq.db
 [wq.db.rest]: https://wq.io/docs/about-rest
 [on the server or on the client]: https://wq.io/docs/templates

 [Getting Started]: https://wq.io/docs/setup
