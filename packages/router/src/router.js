import { createStore, combineReducers, applyMiddleware, compose } from 'redux';
import { connectRoutes, push, NOT_FOUND } from 'redux-first-router';
import queryString from 'query-string';

import tmpl from '@wq/template';

const HTML = '@@HTML',
    RENDER = 'RENDER',
    FIRST = '@@FIRST',
    DEFAULT = '@@DEFAULT',
    LAST = '@@LAST',
    validOrder = {
        [FIRST]: true,
        [DEFAULT]: true,
        [LAST]: true
    };

// Exported module object
var router = {
    config: {
        tmpl404: '404',
        injectOnce: false,
        debug: false,
        getTemplateName: name => name
    },
    routesMap: {},
    contextProcessors: []
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

    $ = config.jQuery || window.jQuery;
    jqm = $.mobile;

    // Configuration options:
    // Define `tmpl404` if there is not a template named '404'
    // Set `injectOnce`to true to re-use rendered templates
    // Set `debug` to true to log template & context information
    // Set getTemplateName to change how route names are resolved.
};

router.jqmInit = function() {
    if (!router.config) {
        throw new Error('Initialize router first!');
    }
    var orderedRoutes = {};
    [FIRST, DEFAULT, LAST].forEach(function(order) {
        Object.entries(router.routesMap).forEach(([name, path]) => {
            if (path.order === order) {
                orderedRoutes[name] = path;
            }
        });
    });
    const { reducer: routeReducer, middleware, enhancer } = connectRoutes(
        orderedRoutes,
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
    if (action.type != RENDER) {
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
    router.render(context);
}

router.register = function(path, nameOrContext, context, order = DEFAULT) {
    var name;
    const newUsage = ' Usage: router.register(path[, name[, contextFn]])';
    if (!validOrder[order]) {
        // Assume old-style prevent() callback was passed
        throw new Error('prevent() no longer supported.' + newUsage);
    }

    if (context) {
        if (typeof context !== 'function') {
            throw new Error(
                'Unexpected ' + context + ' for contextFn.' + newUsage
            );
        }
    } else if (typeof nameOrContext === 'function') {
        context = nameOrContext;
        nameOrContext = null;
    }

    if (nameOrContext) {
        name = nameOrContext;
        if (typeof name !== 'string') {
            throw new Error(
                'Unexpected ' + name + ' for route name.' + newUsage
            );
        }
    } else {
        if (path.indexOf('/') > -1) {
            throw new Error(
                'router.register() now requires a route name if path contains /.' +
                    newUsage
            );
        }
        // Assume there is a template with the same name
        name = path;
    }

    if (context && context.length > 1) {
        throw new Error(
            'contextFn should take a single argument (the existing context) and return a new context for merging.  router.go() is now called automatically.'
        );
    }

    router.routesMap[name.toUpperCase()] = {
        path: _normalizePath(path),
        thunk: _generateContext,
        order
    };

    if (context) {
        router.addContextForRoute(name, context);
    }
    return name;
};

router.registerFirst = function(path, name, context) {
    router.register(path, name, context, FIRST);
};

router.registerLast = function(path, name, context) {
    router.register(path, name, context, LAST);
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
    $('body').on(jqmEvents[eventCode] + '.' + name, function() {
        const state = router.store.getState(),
            { context } = state,
            { router_info } = context;
        if (router_info && router_info.name == name) {
            fn();
        }
    });
};

router.push = function(path) {
    push(path);
};

router.render = function(context) {
    router.store.dispatch({
        type: RENDER,
        payload: context
    });
};

router.refresh = function() {
    var context = router.store.getState().context;
    context._refreshCount = (context._refreshCount || 0) + 1;
    router.render(context);
};

// Inject and display page
var _lastPath, _lastRefresh;
router.go = function(arg) {
    if (arg) {
        throw new Error('router.go() is now called automatically');
    }

    const state = router.store.getState(),
        { location, context } = state,
        { router_info } = context,
        { full_path: url, _refreshCount: refresh, dom_id: pageid } =
            router_info || {},
        once = null, // FIXME
        ui = null; // FIXME

    if (url === _lastPath && refresh === _lastRefresh) {
        return;
    }

    _lastPath = url;
    _lastRefresh = refresh;

    var template;
    if (location.type === NOT_FOUND || context[NOT_FOUND]) {
        template = router.config.tmpl404;
        context.url = location.pathname;
    } else {
        template = router.config.getTemplateName(router_info.name, context);
    }

    if (context[HTML]) {
        return tmpl.injectHTML(HTML);
    }

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
        options.allowSamePageTransition = true;
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
router.notFound = function() {
    return {
        [NOT_FOUND]: true
    };
};

// Use when loading HTML from server
router.rawHTML = function(html) {
    return {
        [HTML]: html
    };
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
    info.full_path =
        location.pathname + (location.search ? '?' + location.search : '');
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
