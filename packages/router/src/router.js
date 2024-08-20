import { capitalCase } from "capital-case";
import { getStore } from "@wq/store";
import { createContext, useContext } from "react";
import { useSelector } from "react-redux";

export const HTML = "@@HTML",
    SET_ROUTE_INFO = "SET_ROUTE_INFO",
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

// Exported module object
var router = {
    config: {
        store: "main",
        tmpl404: "404",
        debug: false,
        getTemplateName: (name) => name,
        parseRouteInfo: () => {
            throw new Error("No parser defined");
        },
    },
    routes: {},
    routeInfoFn: [],
    contextProcessors: [],
    async setRouteInfo(location) {
        const current = router.computeRouteInfo(location);
        this.store.dispatch({
            type: SET_ROUTE_INFO,
            payload: current,
        });
        const context = await router.generateContext(current);
        router.render(context);
        return context;
    },
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

    router.store = getStore(router.config.store);
    router.store.addReducer(
        "context",
        (state, action) => router.contextReducer(state, action) || {}
    );
    router.store.addReducer(
        "routeInfo",
        (state, action) => router.routeInfoReducer(state, action) || {}
    );
};

router.start = function () {
    // pass
};

router.contextReducer = function (context = {}, action) {
    if (action.type != RENDER) {
        return context;
    }
    const current = action.payload;
    return {
        ...context,
        [current.router_info.name]: current,
        [CURRENT]: current,
    };
};

router.routeInfoReducer = function (routeInfo, action) {
    if (action.type != SET_ROUTE_INFO) {
        return routeInfo;
    }
    const current = action.payload;
    return {
        ...routeInfo,
        [current.name]: current,
        [CURRENT]: current,
    };
};

router.generateContext = async function (routeInfo) {
    var context = {
        router_info: routeInfo,
        rt: router.base_url,
    };
    for (var i = 0; i < router.contextProcessors.length; i++) {
        var fn = router.contextProcessors[i];
        context = {
            ...context,
            ...((await fn(context)) || {}),
        };
    }
    return context;
};

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

    router.routes[name] = {
        path: _normalizePath(path),
        thunk,
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

// TODO: Deprecate, then remove in 3.0
router.addThunk = function (name, thunk) {
    router.routes[name] = {
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
router.reload = async function () {
    const { _refreshCount, router_info: routeInfo } = router.getContext(),
        refresh = (_refreshCount || 0) + 1,
        context = await router.generateContext(routeInfo);
    router.render(context, refresh);
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
    if (router.routes[pathOrName.toLowerCase()]) {
        name = pathOrName;
    } else {
        Object.entries(router.routes).forEach(([rname, rpath]) => {
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

var _lastRouteInfo = null;
router.computeRouteInfo = function (location) {
    const info = _computeRouteInfo(location);
    if (JSON.stringify(info) !== JSON.stringify(_lastRouteInfo)) {
        _lastRouteInfo = info;
    }
    return _lastRouteInfo;
};

function _computeRouteInfo(location) {
    let info = router.config.parseRouteInfo(location);
    info.base_url = router.base_url;
    router.routeInfoFn.forEach((fn) => (info = fn(info)));
    return info;
}

export default router;

export const RouteContext = createContext({
    name: "@@CURRENT",
});

export function useCurrentRoute() {
    return useContext(RouteContext).name;
}

function selectContext(state) {
    return state["context"];
}

export function useRenderContext(routeName) {
    const context = useSelector(selectContext),
        currentRoute = useCurrentRoute();
    return (context && context[routeName || currentRoute]) || {};
}
function selectRouteInfo(state) {
    return state["routeInfo"];
}

export function useRouteInfo(routeName) {
    const currentRoute = useCurrentRoute(),
        routeInfos = useSelector(selectRouteInfo),
        routeInfo = routeInfos && routeInfos[routeName || currentRoute],
        context = useRenderContext(routeName);

    return router.getRouteInfo(context, routeInfo);
}

export function useContextTitle() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo();

    return router.getContextTitle(context, routeInfo);
}
