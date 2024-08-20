import { useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import * as ReduxFirstRouter from "redux-first-router";
import queryString from "query-string";
import router, { CURRENT, RENDER, FIRST, DEFAULT, LAST } from "./router.js";

const {
    connectRoutes,
    push,
    NOT_FOUND,
    ADD_ROUTES,
    pathToAction,
    getOptions,
    selectLocationState,
} = ReduxFirstRouter;

const defaultQuerySerializer = {
    parse(str) {
        return queryString.parse(str, { arrayFormat: "comma" });
    },
    stringify(obj) {
        return queryString.stringify(obj, { arrayFormat: "comma" });
    },
};

router.config.querySerializer = defaultQuerySerializer;
router.config.parseRouteInfo = function (location) {
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
    return info;
};

function _removeBase(pathname) {
    return pathname.replace(router.base_url + "/", "");
}

// Configuration
const _routerInit = router.init;
router.init = function (config) {
    _routerInit.call(router, config);
    const { reducer, middleware, enhancer, initialDispatch } = connectRoutes(
        {},
        {
            querySerializer: router.config.querySerializer,
            initialDispatch: false,
        }
    );
    router.store.addReducer("location", reducer);
    router.store.addEnhancer(enhancer);
    router.store.addMiddleware(middleware);
    router.store.setThunkHandler(router.addThunk);
    router._initialDispatch = initialDispatch;
};

router.start = function () {
    const orderedRoutes = {};
    [FIRST, DEFAULT, LAST].forEach(function (order) {
        Object.entries(router.routes).forEach(([name, path]) => {
            if (path.order !== order) {
                return;
            }
            orderedRoutes[name.toUpperCase()] = _createRoute(path);
        });
    });
    router.store.dispatch({
        type: ADD_ROUTES,
        payload: { routes: orderedRoutes },
    });
    router._initialDispatch();
};

function _createRoute({ path, thunk }) {
    return {
        path,
        async thunk(dispatch, getState, bag) {
            const context = await router.generateContext(
                router.computeRouteInfo(getState().location)
            );
            router.render(context);
            if (thunk) {
                thunk(dispatch, getState, bag);
            }
        },
    };
}

router.contextReducer = function (context = {}, action) {
    if (action.type != RENDER && action.type != NOT_FOUND) {
        return context;
    }
    let current;
    if (action.type === RENDER) {
        current = action.payload;
    } else if (action.type === NOT_FOUND) {
        const routeInfo = router.computeRouteInfo(action.meta.location);
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
};

router.routeInfoReducer = function (routeInfo, action) {
    if (action.meta && action.meta.location) {
        const current = router.computeRouteInfo(action.meta.location);
        return {
            ...routeInfo,
            [current.name]: current,
            [CURRENT]: current,
        };
    } else {
        return routeInfo;
    }
};

router.push = function (path) {
    push(path);
};
router.notFound = function () {
    return {
        [NOT_FOUND]: true,
    };
};

function selectRoutesMap(state) {
    return selectLocationState(state).routesMap;
}

export default router;

export {
    useRouteInfo,
    useRenderContext,
    useContextTitle,
    RouteContext,
} from "./router.js";

const isAction = (path) => path && path.type;

function useRoutesMap() {
    return useSelector(selectRoutesMap);
}

function toNavAction(path, routesMap) {
    const { querySerializer } = getOptions(),
        baseUrl = routesMap.INDEX ? routesMap.INDEX.path : "/";
    return isAction(path)
        ? path
        : pathToAction(
              path.indexOf("/") === 0 ? path : baseUrl + path,
              routesMap,
              querySerializer
          );
}

function useNavAction() {
    const routesMap = useRoutesMap();
    return useCallback((path) => toNavAction(path, routesMap), [routesMap]);
}

export function useNav(to) {
    const dispatch = useDispatch(),
        navAction = useNavAction();
    return useMemo(() => {
        function nav(path) {
            dispatch(navAction(path));
        }
        return to ? nav.bind(null, to) : nav;
    }, [dispatch, navAction, to]);
}

export function useReverse() {
    const routesMap = useRoutesMap();
    return useCallback(
        (name, payload, query) => {
            const action = {
                type: name.toUpperCase(),
            };
            if (!routesMap[action.type]) {
                throw new Error(`Unknown route: ${action.type}`);
            }
            if (payload) {
                if (typeof payload === "object") {
                    action.payload = payload;
                } else {
                    action.payload = { slug: payload };
                }
            }
            if (query) {
                action.meta = { query };
            }
            return action;
        },
        [routesMap]
    );
}
