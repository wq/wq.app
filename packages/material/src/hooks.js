import React, { useCallback, useContext } from 'react';
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
    const context = useSelector(state => state.context),
        location = useSelector(selectLocationState),
        { router_info: routeInfo } = context;
    if (routeInfo) {
        return {
            ...routeInfo,
            pending: routeInfo.full_path.split('?')[0] !== location.pathname
        };
    } else {
        return { pending: true };
    }
}

export function useTitle() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo();

    const title =
        context.title ||
        context.label ||
        (routeInfo && routeInfo.name && routeInfo.name.replace('_', ' ')) ||
        'Loading...';

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

export function useSpinner() {
    const spinner = useSelector(state => state.spinner);
    return spinner;
}

export const ComponentConfig = React.createContext({
    components: {},
    views: {}
});

export function useComponents() {
    return useContext(ComponentConfig).components;
}

export function useViews() {
    return useContext(ComponentConfig).views;
}
