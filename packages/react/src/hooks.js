import React, { useMemo, useCallback, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
    pathToAction,
    getOptions,
    selectLocationState
} from 'redux-first-router';

const isAction = path => path && path.type;

export function useNav() {
    const dispatch = useDispatch(),
        routesMap = useSelector(state => selectLocationState(state).routesMap),
        { querySerializer } = getOptions();
    return useCallback(
        path => {
            const action = isAction(path)
                ? path
                : pathToAction('/' + path, routesMap, querySerializer);
            dispatch(action);
        },
        [dispatch, routesMap, querySerializer]
    );
}

export function useRenderContext() {
    const context = useSelector(state => state.context);
    return context;
}

export function useRouteInfo() {
    const routeInfo = useSelector(state => state.routeInfo),
        context = useSelector(state => state.context),
        { router_info: ctxRouteInfo } = context;
    if (routeInfo) {
        if (!ctxRouteInfo || ctxRouteInfo.full_path !== routeInfo.full_path) {
            return {
                ...routeInfo,
                pending: true
            };
        } else {
            return ctxRouteInfo;
        }
    } else {
        return { pending: true };
    }
}

export function useTitle() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo();

    var title;
    if (routeInfo && !routeInfo.pending) {
        title = context.title || context.label;
    }

    if (!title && routeInfo) {
        title = routeInfo.name && routeInfo.name.replace('_', ' ');
    }

    if (!title) {
        title = 'Loading...';
    }

    return title;
}

export function useReverse() {
    const location = useSelector(selectLocationState);
    return useCallback(
        (name, payload, query) => {
            const action = {
                type: name.toUpperCase()
            };
            if (!location.routesMap[action.type]) {
                throw new Error(`Unknown route: ${action.type}`);
            }
            if (payload) {
                if (typeof payload === 'object') {
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
        [location]
    );
}

export function useIndexRoute() {
    // FIXME: This should be read from the configuration
    return 'index';
}

export function useBreadcrumbs() {
    const title = useTitle(),
        { name, page, item_id, mode, full_path } = useRouteInfo(),
        reverse = useReverse(),
        index = useIndexRoute();

    if (name === index) {
        return null;
    }

    const links = [],
        addLink = (url, label) => links.push({ url, label }),
        addCurrentPage = label => addLink(full_path, label);

    addLink(reverse(index), 'Home');

    if (item_id) {
        addLink(reverse(`${page}_list`), `${page} list`);
        if (mode !== 'detail') {
            addLink(reverse(`${page}_detail`, item_id), title);
            addCurrentPage(mode);
        } else {
            addCurrentPage(title);
        }
    } else {
        addCurrentPage(title);
    }

    return links;
}

export function useSpinner() {
    const spinner = useSelector(state => state.spinner);
    return spinner;
}

export const AppContext = React.createContext({
    components: {},
    views: {},
    app: {
        plugins: {}
    }
});

export function useComponents() {
    return useContext(AppContext).components;
}

export function useViews() {
    return useContext(AppContext).views;
}

export function useApp() {
    return useContext(AppContext).app;
}

export function usePlugin(name) {
    const { plugins } = useApp();
    return plugins[name];
}

export function usePluginContent() {
    const { app } = useContext(AppContext),
        components = useComponents(),
        routeInfo = useRouteInfo();

    const content = useMemo(
        () => app
            .callPlugins('runComponent', [routeInfo])
            .map(name => (name ? components[name] : null))
            .filter(component => !!component),
        [routeInfo]
    );

    return useCallback(
        function PluginContent(){
            if (!content.length) {
                return null;
            } else {
                return (
                    <>
                        {content.map((Component, i) => (
                            <Component key={i} />
                        ))}
                    </>
                );
            }
        }
        [content]
    );
}
