import { connectRoutes, push, NOT_FOUND, ADD_ROUTES } from 'redux-first-router';
import queryString from 'query-string';
import { getStore } from '@wq/store';

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
        store: 'main',
        tmpl404: '404',
        injectOnce: false,
        debug: false,
        getTemplateName: name => name
    },
    routesMap: {},
    contextProcessors: [],
    renderers: [render]
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

    // Configuration options:
    // Define `tmpl404` if there is not a template named '404'
    // Set `injectOnce`to true to re-use rendered templates
    // Set `debug` to true to log template & context information
    // Set getTemplateName to change how route names are resolved.

    $ = config.jQuery || window.jQuery;
    jqm = $.mobile;

    const {
        reducer: routeReducer,
        middleware,
        enhancer,
        initialDispatch
    } = connectRoutes(
        {},
        { querySerializer: queryString, initialDispatch: false }
    );
    router.store = getStore(router.config.store);
    router.store.addReducer('location', routeReducer);
    router.store.addReducer('context', contextReducer);
    router.store.addEnhancer(enhancer);
    router.store.addMiddleware(middleware);
    router.store.setThunkHandler(router.addThunk);
    router.store.subscribe(router.go);
    router._initialDispatch = initialDispatch;
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
    router.store.dispatch({
        type: ADD_ROUTES,
        payload: { routes: orderedRoutes }
    });
    router._initialDispatch();

    jqm.initializePage();
};

function contextReducer(context = {}, action) {
    if (action.type != RENDER && action.type != NOT_FOUND) {
        return context;
    }
    if (action.type === RENDER) {
        context = action.payload;
    } else if (action.type === NOT_FOUND) {
        context = _routeInfo({
            ...action.meta.location.current,
            prev: action.meta.location.prev
        });
    }
    return context;
}

async function _generateContext(dispatch, getState, refresh = false) {
    const location = getState().location;
    var context = _routeInfo(location);
    for (var i = 0; i < router.contextProcessors.length; i++) {
        var fn = router.contextProcessors[i];
        context = {
            ...context,
            ...((await fn(context)) || {})
        };
    }
    return router.render(context, refresh);
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
        thunk: (dispatch, getState) => _generateContext(dispatch, getState),
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

router.addThunk = function(name, thunk) {
    router.routesMap[name] = {
        thunk,
        order: FIRST
    };
};

router.addThunks = function(thunks) {
    Object.entries(thunks).forEach(([name, thunk]) => {
        router.addThunk(name, thunk);
    });
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
            { router_info } = context || {};
        if (router_info && router_info.name == name) {
            fn();
        }
    });
};

router.addRender = function(render) {
    router.renderers.push(render);
};

router.push = function(path) {
    push(path);
};

router.render = function(context, refresh) {
    if (refresh) {
        if (refresh === true) {
            refresh = (context._refreshCount || 0) + 1;
        }
        context._refreshCount = refresh;
    }
    return router.store.dispatch({
        type: RENDER,
        payload: context
    });
};

// Re-render existing context
router.refresh = function() {
    var context = router.store.getState().context;
    router.render(context, true);
};

// Regenerate context, then re-render page
router.reload = function() {
    const context = router.store.getState().context,
        refresh = (context._refreshCount || 0) + 1;
    return _generateContext(
        action => router.store.dispatch(action),
        () => router.store.getState(),
        refresh
    );
};

// Inject and display page
router.go = function(arg) {
    if (arg) {
        throw new Error('router.go() is now called automatically');
    }
    const state = router.store.getState();
    router.renderers.forEach(render => {
        try {
            render(state);
        } catch (e) {
            console.error(e);
        }
    });
};

var _lastPath, _lastRefresh;
function render(state) {
    const { location, context } = state,
        { router_info, _refreshCount: refresh } = context || {},
        { full_path: url, dom_id: pageid, name: routeName } = router_info || {},
        once = null, // FIXME
        ui = null; // FIXME

    if (!routeName || routeName != location.type.toLowerCase()) {
        return;
    }
    if (url === _lastPath && refresh === _lastRefresh) {
        return;
    }

    _lastPath = url;
    _lastRefresh = refresh;

    var template;
    if (location.type === NOT_FOUND || context[NOT_FOUND]) {
        template = router.config.tmpl404;
        context.url = url;
    } else {
        template = router.config.getTemplateName(routeName, context);
    }

    var $page,
        role,
        options,
        html = context[HTML];
    if (html) {
        if (router.config.debug) {
            console.log('Injecting pre-rendered HTML:');
            console.log(html);
        }
        $page = tmpl.injectHTML(html, url, pageid);
    } else {
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
        if (once || router.config.injectOnce) {
            // Only render the template once
            $page = tmpl.injectOnce(template, context, url, pageid);
        } else {
            // Default: render the template every time the page is loaded
            $page = tmpl.inject(template, context, url, pageid);
        }
    }

    $page.on('click', 'a', _handleLink);

    role = $page.jqmData('role') || 'page';
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
}

function _handleLink(evt) {
    const target = evt.currentTarget;
    if (target.rel === 'external') {
        return;
    }
    const href = target.href;
    if (href === undefined) {
        return;
    }
    const url = new URL(href, window.location);
    if (url.origin != window.location.origin) {
        return;
    }
    evt.preventDefault();
    router.push(url.pathname + url.search);
}

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
