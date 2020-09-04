import React, { useMemo, useCallback, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'redux-orm/src/index.js';
import {
    pathToAction,
    getOptions,
    selectLocationState
} from 'redux-first-router';
import { paramCase } from 'param-case';
import { capitalCase } from 'capital-case';
import { useHtmlInput } from './components/inputs/Input';

const isAction = path => path && path.type;

export function useRoutesMap() {
    return useSelector(state => selectLocationState(state).routesMap);
}

export function useNav(to) {
    const dispatch = useDispatch(),
        routesMap = useRoutesMap(),
        { querySerializer } = getOptions();

    return useMemo(() => {
        function nav(path) {
            const action = isAction(path)
                ? path
                : pathToAction(
                      path.indexOf('/') === 0 ? path : '/' + path,
                      routesMap,
                      querySerializer
                  );
            dispatch(action);
        }
        return to ? nav.bind(null, to) : nav;
    }, [dispatch, routesMap, querySerializer, to]);
}

export const RouteContext = React.createContext({
    name: '@@CURRENT'
});

function useCurrentRoute() {
    return useContext(RouteContext).name;
}

export function useRenderContext() {
    const context = useSelector(state => state.context),
        currentRoute = useCurrentRoute();
    return (context && context[currentRoute]) || {};
}

export function useRouteInfo() {
    const currentRoute = useCurrentRoute(),
        routeInfos = useSelector(state => state.routeInfo),
        routeInfo = routeInfos && routeInfos[currentRoute],
        context = useRenderContext(),
        { router_info: ctxRouteInfo } = context;
    if (routeInfo) {
        if (
            !ctxRouteInfo ||
            ['name', 'mode', 'variant', 'item_id'].some(
                key => ctxRouteInfo[key] != routeInfo[key]
            )
        ) {
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

export function useContextTitle() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo();

    var title;
    if (routeInfo && !routeInfo.pending) {
        title = context.title || context.label;
    }

    if (!title && routeInfo) {
        title = getRouteTitle(routeInfo);
    }

    if (!title) {
        title = 'Loading...';
    }

    return title;
}

export function useRouteTitle(routeName) {
    const app = useApp();

    function routeTitle(routeName) {
        const [name, mode, variant] = app.splitRoute(routeName);
        const page_config = app.config.pages[name] || {
            name
        };
        return getRouteTitle({
            page_config,
            mode,
            variant
        });
    }

    if (routeName) {
        return routeTitle(routeName);
    } else {
        return routeTitle;
    }
}

function getRouteTitle(routeInfo) {
    const { page_config, mode, variant } = routeInfo,
        verbose_name = page_config.verbose_name || page_config.name,
        verbose_name_plural =
            page_config.verbose_name_plural ||
            page_config.url ||
            `${verbose_name}s`;

    let title;
    if (mode === 'list' && verbose_name === 'outbox') {
        title = 'outbox';
    } else if (mode === 'list') {
        title = verbose_name_plural;
    } else if (mode === 'edit') {
        if (variant === 'new') {
            title = `New ${verbose_name}`;
        } else {
            title = `Edit ${verbose_name}`;
        }
    } else if (mode && mode !== 'detail') {
        title = `${verbose_name} - ${mode}`;
    } else {
        title = verbose_name;
    }

    return capitalCase(title);
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
    const title = useContextTitle(),
        {
            name,
            page,
            page_config,
            item_id,
            mode,
            full_path,
            parent_id,
            parent_label,
            parent_conf
        } = useRouteInfo(),
        reverse = useReverse(),
        index = useIndexRoute();

    if (name === index) {
        return null;
    }

    const links = [],
        addLink = (url, label) => links.push({ url, label }),
        addCurrentPage = label => addLink(full_path, label);

    addLink(reverse(index), 'Home');

    if (parent_id && parent_conf) {
        addLink(
            reverse(`${parent_conf.page}_list`),
            getRouteTitle({
                page_config: parent_conf,
                mode: 'list'
            })
        );
        addLink(reverse(`${parent_conf.page}_detail`, parent_id), parent_label);
    }

    if (item_id) {
        addLink(
            reverse(`${page_config.name}_list`),
            getRouteTitle({
                page_config,
                mode: 'list'
            })
        );
        if (mode !== 'detail') {
            const currentTitle = getRouteTitle({ page_config, mode }),
                detailTitle = getRouteTitle({ page_config, mode: 'detail' });
            addLink(
                reverse(`${page}_detail`, item_id),
                title === currentTitle ? detailTitle : title
            );
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
    app: {
        plugins: {},
        models: {}
    }
});

export function useComponents() {
    return usePluginComponentMap('react', 'components');
}

export function useInputComponents() {
    return usePluginComponentMap('react', 'inputs');
}

export { useHtmlInput };

export function useIconComponents() {
    return usePluginComponentMap('react', 'icons');
}

export function useViewComponents() {
    return usePluginComponentMap('react', 'views');
}

export function useApp() {
    return useContext(AppContext).app;
}

export function useModel(name, filter) {
    const app = useApp(),
        model = app.models[name];

    if (!model) {
        throw new Error(`Unknown model name ${name}`);
    }

    let selector;
    if (
        typeof filter === 'function' ||
        (typeof filter === 'object' && !Array.isArray(filter))
    ) {
        selector = createSelector(model.orm, session =>
            session[name].filter(filter).toRefArray()
        );
    } else {
        selector = state => createSelector(model.orm[name])(state, filter);
    }

    return useSelector(selector);
}

export function useUnsynced(modelConf) {
    const outbox = useSelector(state => state.offline.outbox) || [],
        {
            outbox: { filterUnsynced, parseOutbox }
        } = useApp();

    return filterUnsynced(parseOutbox(outbox), modelConf);
}

export function useList() {
    const { list: contextList = [], show_unsynced } = useRenderContext(),
        { page_config } = useRouteInfo(),
        modelList = useModel(page_config.page),
        unsynced = useUnsynced(page_config);

    let list;
    if (show_unsynced) {
        // Context list should generally already equal model list, unless
        // there has been a sync or other model update since last RENDER.
        const seen = {};
        modelList.forEach(row => (seen[row.id] = true));
        list = modelList.concat(contextList.filter(row => !seen[row.id]));
    } else {
        // Context list probably came directly from server, ignore local model
        list = contextList;
    }
    const empty = !list || !list.length;

    return {
        page_config,
        list,
        unsynced: show_unsynced ? unsynced : [],
        empty
    };
}

export function usePlugin(name) {
    const { plugins } = useApp();
    return plugins[name];
}

export function usePluginComponentMap(pluginName, mapName) {
    const plugin = usePlugin(pluginName) || {},
        { config = {} } = plugin,
        { [mapName]: componentMap = {} } = config;
    Object.entries(componentMap).forEach(([key, val]) => {
        componentMap[paramCase(key)] = val;
    });
    return componentMap;
}

export function usePluginState(name) {
    const plugin = usePlugin(name),
        pluginState = useSelector(state => state[name]);

    if (plugin) {
        return pluginState;
    } else {
        return null;
    }
}

export function usePluginContent() {
    const app = useApp(),
        components = useComponents(),
        routeInfo = useRouteInfo();

    const content = useMemo(
        () =>
            app
                .callPlugins('runComponent', [routeInfo])
                .map(name => (name ? components[name] : null))
                .filter(component => !!component),
        [routeInfo]
    );

    return useCallback(
        function PluginContent() {
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
        },
        [content]
    );
}

export function useMessages() {
    const { config } = usePlugin('react');
    return config.messages;
}
