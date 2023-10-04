import * as ReduxFirstRouter from "redux-first-router";
import queryString from "query-string";
import { capitalCase } from "capital-case";
import { getStore } from "@wq/store";

const { connectRoutes, push, NOT_FOUND, ADD_ROUTES } = ReduxFirstRouter;

const HTML = "@@HTML",
    RENDER = "RENDER",
    FIRST = "@@FIRST",
    DEFAULT = "@@DEFAULT",
    LAST = "@@LAST",
    CURRENT = "@@CURRENT",
    validOrder = {
        [FIRST]: true,
        [DEFAULT]: true,
        [LAST]: true,
    };

const defaultQuerySerializer = {
    parse(str) {
        return queryString.parse(str, { arrayFormat: "comma" });
    },
    stringify(obj) {
        return queryString.stringify(obj, { arrayFormat: "comma" });
    },
};

// Exported module object
var router = {
    config: {
        store: "main",
        tmpl404: "404",
        debug: false,
        getTemplateName: (name) => name,
        querySerializer: defaultQuerySerializer,
    },
    routesMap: {},
    routeInfoFn: [],
    contextProcessors: [],
};

// Configuration
router.init = function (config) {
    // Define baseurl (without trailing slash) if it is not /
    if (config && config.base_url) {
        router.base_url = config.base_url;
    }

    router.config = {
        ...router.config,
        ...config,
    };

    // Configuration options:
    // Define `tmpl404` if there is not a template named '404'
    // Set `debug` to true to log template & context information
    // Set getTemplateName to change how route names are resolved.

    const {
        reducer: routeReducer,
        middleware,
        enhancer,
        initialDispatch,
    } = connectRoutes(
        {},
        {
            querySerializer: router.config.querySerializer,
            initialDispatch: false,
        }
    );
    router.store = getStore(router.config.store);
    router.store.addReducer("location", routeReducer);
    router.store.addReducer("context", contextReducer);
    router.store.addReducer("routeInfo", routeInfoReducer);
    router.store.addEnhancer(enhancer);
    router.store.addMiddleware(middleware);
    router.store.setThunkHandler(router.addThunk);
    router._initialDispatch = initialDispatch;
};

router.start = function () {
    if (!router.config) {
        throw new Error("Initialize router first!");
    }
    var orderedRoutes = {};
    [FIRST, DEFAULT, LAST].forEach(function (order) {
        Object.entries(router.routesMap).forEach(([name, path]) => {
            if (path.order === order) {
                orderedRoutes[name] = path;
            }
        });
    });
    router.store.dispatch({
        type: ADD_ROUTES,
        payload: { routes: orderedRoutes },
    });
    router._initialDispatch();
};

function contextReducer(context = {}, action) {
    if (action.type != RENDER && action.type != NOT_FOUND) {
        return context;
    }
    let current;
    if (action.type === RENDER) {
        current = action.payload;
    } else if (action.type === NOT_FOUND) {
        const routeInfo = _routeInfo(action.meta.location);
        current = {
            router_info: {
                ...routeInfo,
                template: router.config.tmpl404,
            },
            rt: router.base_url,
            url: routeInfo.full_path,
        };
    }
    return {
        ...context,
        [current.router_info.name]: current,
        [CURRENT]: current,
    };
}

function routeInfoReducer(routeInfo = {}, action) {
    if (action.meta && action.meta.location) {
        const current = _routeInfo(action.meta.location);
        return {
            ...routeInfo,
            [current.name]: current,
            [CURRENT]: current,
        };
    } else {
        return routeInfo;
    }
}

async function _generateContext(dispatch, getState, refresh = false) {
    const location = getState().location;
    var context = {
        router_info: _routeInfo(location),
        rt: router.base_url,
    };
    for (var i = 0; i < router.contextProcessors.length; i++) {
        var fn = router.contextProcessors[i];
        context = {
            ...context,
            ...((await fn(context)) || {}),
        };
    }
    if (context[NOT_FOUND]) {
        context.router_info.template = router.config.tmpl404;
        context.url = context.router_info.full_path;
    }
    return router.render(context, refresh);
}

router.register = function (
    path,
    nameOrContext,
    context,
    order = DEFAULT,
    thunk = null
) {
    var name;
    const newUsage = " Usage: router.register(path[, name[, contextFn]])";
    if (!validOrder[order]) {
        // Assume old-style prevent() callback was passed
        throw new Error("prevent() no longer supported." + newUsage);
    }

    if (context) {
        if (typeof context !== "function") {
            throw new Error(
                "Unexpected " + context + " for contextFn." + newUsage
            );
        }
    } else if (typeof nameOrContext === "function") {
        context = nameOrContext;
        nameOrContext = null;
    }

    if (nameOrContext) {
        name = nameOrContext;
        if (typeof name !== "string") {
            throw new Error(
                "Unexpected " + name + " for route name." + newUsage
            );
        }
    } else {
        if (path.indexOf("/") > -1) {
            throw new Error(
                "router.register() now requires a route name if path contains /." +
                    newUsage
            );
        }
        // Assume there is a template with the same name
        name = path;
    }

    if (context && context.length > 1) {
        throw new Error(
            "contextFn should take a single argument (the existing context) and return a new context for merging."
        );
    }

    function thunkFn(dispatch, getState, bag) {
        _generateContext(dispatch, getState);
        if (thunk) {
            thunk(dispatch, getState, bag);
        }
    }

    router.routesMap[name.toUpperCase()] = {
        path: _normalizePath(path),
        thunk: thunkFn,
        order,
    };

    if (context) {
        router.addContextForRoute(name, context);
    }

    return name;
};

router.registerFirst = function (path, name, context) {
    router.register(path, name, context, FIRST);
};

router.registerLast = function (path, name, context) {
    router.register(path, name, context, LAST);
};

router.addThunk = function (name, thunk) {
    router.routesMap[name] = {
        thunk,
        order: FIRST,
    };
};

router.addThunks = function (thunks, thisObj) {
    Object.entries(thunks).forEach(([name, thunk]) => {
        if (thisObj) {
            thunk = thunk.bind(thisObj);
        }
        router.addThunk(name, thunk);
    });
};

router.addContext = function (fn) {
    router.contextProcessors.push(fn);
};

router.addContextForRoute = function (pathOrName, fn) {
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

router.onShow = function () {
    throw new Error("router.onShow() is removed.  Use a run() plugin instead");
};

router.addRoute = function () {
    throw new Error(
        "router.addRoute() is removed.  Use a run() plugin instead"
    );
};

router.push = function (path) {
    push(path);
};

router.render = function (context, refresh) {
    if (refresh) {
        if (refresh === true) {
            refresh = (context._refreshCount || 0) + 1;
        }
        context = {
            ...context,
            _refreshCount: refresh,
        };
    }

    const { site_title } = router.config;
    let title = router.getContextTitle(context, context.router_info);
    if (site_title && title !== site_title) {
        title = `${title} - ${site_title}`;
    }
    if (window.document) window.document.title = title;

    return router.store.dispatch({
        type: RENDER,
        payload: context,
    });
};

router.getContext = function () {
    const { context = {} } = router.store.getState();
    return context[CURRENT];
};

// Re-render existing context
router.refresh = function () {
    const context = router.getContext();
    router.render(context, true);
};

// Regenerate context, then re-render page
router.reload = function () {
    const context = router.getContext(),
        refresh = (context._refreshCount || 0) + 1;
    return _generateContext(
        (action) => router.store.dispatch(action),
        () => router.store.getState(),
        refresh
    );
};

// Simple 404 page helper
router.notFound = function () {
    return {
        [NOT_FOUND]: true,
    };
};

// Use when loading HTML from server
router.rawHTML = function (html) {
    return {
        [HTML]: html,
    };
};

router.base_url = "";

router.addRouteInfo = function (fn) {
    router.routeInfoFn.push(fn);
};

router.getRouteInfo = function (context, routeInfo) {
    const { router_info: ctxRouteInfo } = context;
    if (routeInfo) {
        if (
            !ctxRouteInfo ||
            ["name", "mode", "variant", "item_id"].some(
                (key) => ctxRouteInfo[key] != routeInfo[key]
            )
        ) {
            return {
                ...routeInfo,
                pending: true,
            };
        } else {
            return ctxRouteInfo;
        }
    } else {
        return NO_ROUTE_INFO;
    }
};

const NO_ROUTE_INFO = { pending: true };

router.getContextTitle = function (context, routeInfo) {
    var title;
    if (routeInfo && !routeInfo.pending) {
        title = context.title || context.label;
    }

    if (!title && routeInfo) {
        title = router.getRouteTitle(routeInfo);
    }

    if (!title) {
        title = "Loading...";
    }

    return title;
};

router.getRouteTitle = function (routeInfo) {
    const { page_config = {}, mode, variant } = routeInfo,
        verbose_name =
            page_config.verbose_name || page_config.name || routeInfo.name,
        verbose_name_plural =
            page_config.verbose_name_plural ||
            page_config.url ||
            `${verbose_name}s`;

    let title,
        prefix = "";
    if (mode === "list" && verbose_name === "outbox") {
        title = "outbox";
    } else if (mode === "list") {
        title = verbose_name_plural;
    } else if (mode === "edit") {
        title = verbose_name;
        if (variant === "new") {
            prefix = "New ";
        } else {
            prefix = "Edit ";
        }
    } else if (mode && mode !== "detail") {
        title = `${verbose_name} - ${mode}`;
    } else {
        title = verbose_name;
    }

    if (title && title === title.toLowerCase()) {
        title = capitalCase(title);
    }

    return prefix + title;
};

function _normalizePath(path) {
    path = path.replace("<slug>", ":slug");
    return router.base_url + "/" + path;
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
        throw new Error("Unrecognized route: " + pathOrName);
    }
    return name.toLowerCase();
}

function _removeBase(pathname) {
    return pathname.replace(router.base_url + "/", "");
}

var _lastRouteInfo = null;
function _routeInfo(location) {
    const info = _computeRouteInfo(location);
    if (JSON.stringify(info) !== JSON.stringify(_lastRouteInfo)) {
        _lastRouteInfo = info;
    }
    return _lastRouteInfo;
}

function _computeRouteInfo(location) {
    if (location.current && location.prev) {
        location = {
            ...location.current,
            prev: location.prev,
        };
    }
    var info = {};
    info.name = location.type.toLowerCase();
    info.template = router.config.getTemplateName(info.name);
    info.prev_path = _removeBase(location.prev.pathname);
    info.path = _removeBase(location.pathname);
    info.path_enc = escape(info.path);
    info.full_path =
        location.pathname + (location.search ? "?" + location.search : "");
    info.full_path_enc = escape(info.full_path);
    info.params = location.query;
    info.slugs = location.payload;
    info.base_url = router.base_url;

    router.routeInfoFn.forEach((fn) => (info = fn(info)));
    return info;
}

export default router;
