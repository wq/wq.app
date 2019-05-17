import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { connectRoutes, push, NOT_FOUND } from 'redux-first-router';
import queryString from 'query-string';

import tmpl from '@wq/template';

// Exported module object
var router = {
    config: {
        tmpl404: '404',
        injectOnce: false,
        debug: false
    }
};
var $, jqm;

// Configuration
router.init = function(config) {
    // Define baseurl (without trailing slash) if it is not /
    if (config && config.base_url) {
        router.base_url = config.base_url;
    }

    router.config = {
        ...router.config,
        ...config
    };

    router.routesMap = {};
    router.contextProcessors = [];

    $ = config.jQuery || window.jQuery;
    jqm = $.mobile;

    // Configuration options:
    // Define `tmpl404` if there is not a template named '404'
    // Set `injectOnce`to true to re-use rendered templates
    // Set `debug` to true to log template & context information
};

router.jqmInit = function() {
    if (!router.config) {
        throw new Error('Initialize router first!');
    }
    const { reducer: routeReducer, middleware, enhancer } = connectRoutes(
        router.routesMap,
        { querySerializer: queryString }
    );
    const reducer = combineReducers({
        location: routeReducer,
        context: contextReducer
    });
    const enhancers = compose(
        enhancer,
        applyMiddleware(middleware)
    );

    router.store = createStore(reducer, {}, enhancers);
    router.store.subscribe(router.go);

    jqm.initializePage();
};

function contextReducer(context = {}, action) {
    if (action.type != 'RENDER') {
        return context;
    }
    context = action.payload;
    return context;
}

async function _generateContext(dispatch, getState) {
    const location = getState().location;
    var context = _routeInfo(location);
    for (var i = 0; i < router.contextProcessors.length; i++) {
        var fn = router.contextProcessors[i];
        context = {
            ...context,
            ...(await fn(context))
        };
    }
    dispatch({
        type: 'RENDER',
        payload: context
    });
}

router.register = function(path, name, obj, prevent) {
    if (!name) {
        // Assume there is a template with the same name
        name = path;
    }
    if (obj || prevent || typeof name === 'function') {
        throw new Error(
            'router.register() now only takes a path and route/template name.'
        );
    }
    router.routesMap[name.toUpperCase()] = {
        path: _normalizePath(path),
        thunk: _generateContext
    };
};

router.addContext = function(fn) {
    router.contextProcessors.push(fn);
};
router.addContextForRoute = function(pathOrName, fn) {
    const name = _getRouteName(pathOrName);
    function contextForRoute(context) {
        if (context.router_info.name == name) {
            return fn(context);
        } else {
            return {};
        }
    }
    router.addContext(contextForRoute);
};

router.onShow = function(pathOrName, fn) {
    router.addRoute(pathOrName, 's', fn);
};

const jqmEvents = {
    s: 'pageshow',
    c: 'pagecreate',
    i: 'pageinit',
    l: 'pageload'
    // 'h': 'pagehide',
};

router.addRoute = function(pathOrName, eventCode, fn, obj) {
    if (!jqmEvents[eventCode]) {
        throw new Error(
            "addRoute for '" + eventCode + "' not currently supported"
        );
    }
    if (obj) {
        fn = obj[fn];
    }
    const name = _getRouteName(pathOrName);
    $('body').on(jqmEvents[eventCode], function() {
        const state = router.store.getState(),
            { context } = state,
            { router_info } = context;
        if (context.router_info.name == name) {
            fn();
        }
    });
};

router.push = push;

// Inject and display page
var _lastPath = null;
router.go = function(arg) {
    if (arg) {
        throw new Error('router.go() is now called automatically');
    }

    const state = router.store.getState(),
        { location, context } = state,
        { router_info } = context;

    if (!router_info || router_info.path === _lastPath) {
        return;
    }

    const { path } = router_info,
        template =
            location.type === NOT_FOUND
                ? router.config.tmpl404
                : location.type.toLowerCase(),
        once = null, // FIXME
        pageid = null, // FIXME
        ui = null; // FIXME

    _lastPath = path;

    var url = router_info.full_path;
    if (router.config.debug) {
        console.log(
            'Rendering ' +
                url +
                " with template '" +
                template +
                "' and context:"
        );
        console.log(context);
    }
    var $page, role, options;
    if (once || router.config.injectOnce) {
        // Only render the template once
        $page = tmpl.injectOnce(template, context, url, pageid);
    } else {
        // Default: render the template every time the page is loaded
        $page = tmpl.inject(template, context, url, pageid);
    }

    role = $page.jqmData('role');
    if (role == 'page') {
        options = (ui && ui.options) || {};
        options._jqmrouter_bC = true;
        if (once) {
            options.allowSamePageTransition = true;
        }
        jqm.changePage($page, options);
    } else if (role == 'popup') {
        options = {};
        if (ui && ui.options) {
            options.transition = ui.options.transition;
            options.positionTo = $page.data('wq-position-to');
            var link = ui.options.link;
            if (link) {
                if (link.jqmData('position-to')) {
                    options.positionTo = link.jqmData('position-to');
                }
                // 'origin' won't work since we're opening the popup manually
                if (!options.positionTo || options.positionTo == 'origin') {
                    options.positionTo = link[0];
                }
                // Remove link highlight *after* popup is closed
                $page.bind('popupafterclose.resetlink', function() {
                    link.removeClass('ui-btn-active');
                    $(this).unbind('popupafterclose.resetlink');
                });
            }
        }
        $page.popup('open', options);
    } else if (role == 'panel') {
        $page.panel('open');
    }
    return $page;
};

// Simple 404 page helper
router.notFound = function(url, ui) {
    var context = { url: url };
    router.go(url, router.config.tmpl404, context, ui);
};

router.base_url = '';

function _normalizePath(path) {
    path = path.replace('<slug>', ':slug');
    return router.base_url + '/' + path;
}

function _getRouteName(pathOrName) {
    var name;
    if (router.routesMap[pathOrName.toUpperCase()]) {
        name = pathOrName;
    } else {
        Object.entries(router.routesMap).forEach(([rname, rpath]) => {
            if (_normalizePath(pathOrName) === rpath.path) {
                name = rname;
            }
        });
    }
    if (!name) {
        throw new Error('Unrecognized route: ' + pathOrName);
    }
    return name.toLowerCase();
}

function _removeBase(pathname) {
    return pathname.replace(router.base_url + '/', '');
}

function _routeInfo(location) {
    var info = {};
    info.name = location.type.toLowerCase();
    info.prev_path = _removeBase(location.prev.pathname);
    info.path = _removeBase(location.pathname);
    info.path_enc = escape(info.path);
    info.full_path = location.pathname;
    info.full_path_enc = escape(info.full_path);
    info.params = location.query;
    info.slugs = location.payload;
    info.base_url = router.base_url;
    return {
        router_info: info,
        rt: router.base_url
    };
}

export default router;
