import React, { useMemo, useCallback, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { createSelector } from 'redux-orm/src/index.js';
import {
    pathToAction,
    getOptions,
    selectLocationState
} from 'redux-first-router';
import { paramCase } from 'param-case';
import { useHtmlInput } from './inputs/Input';

const isAction = path => path && path.type;

const selectors = {};

function getSelector(name) {
    if (!selectors[name]) {
        selectors[name] = state => state[name];
    }
    return selectors[name];
}

function selectRoutesMap(state) {
    return selectLocationState(state).routesMap;
}

export function useRoutesMap() {
    return useSelector(selectRoutesMap);
}

export function toNavAction(path, routesMap) {
    const { querySerializer } = getOptions(),
        baseUrl = routesMap.INDEX ? routesMap.INDEX.path : '/';
    return isAction(path)
        ? path
        : pathToAction(
              path.indexOf('/') === 0 ? path : baseUrl + path,
              routesMap,
              querySerializer
          );
}

export function useNavAction() {
    const routesMap = useRoutesMap();
    return useCallback(path => toNavAction(path, routesMap), [routesMap]);
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

export const RouteContext = React.createContext({
    name: '@@CURRENT'
});

function useCurrentRoute() {
    return useContext(RouteContext).name;
}

export function useRenderContext(routeName) {
    const context = useSelector(getSelector('context')),
        currentRoute = useCurrentRoute();
    return (context && context[routeName || currentRoute]) || {};
}

export function useRouteInfo(routeName) {
    const currentRoute = useCurrentRoute(),
        routeInfos = useSelector(getSelector('routeInfo')),
        routeInfo = routeInfos && routeInfos[routeName || currentRoute],
        context = useRenderContext(routeName),
        { getRouteInfo } = useApp().router;

    return getRouteInfo(context, routeInfo);
}

export function useSiteTitle() {
    const siteTitle = useConfig().site_title,
        contextTitle = useContextTitle();
    return siteTitle || contextTitle;
}

export function useContextTitle() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo(),
        { getContextTitle } = useApp().router;

    return getContextTitle(context, routeInfo);
}

export function useRouteTitle(routeName) {
    const app = useApp(),
        { getRouteTitle } = app.router,
        config = useConfig();

    function routeTitle(routeName) {
        const [name, mode, variant] = app.splitRoute(routeName);
        const page_config = config.pages[name] || {
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
        index = useIndexRoute(),
        { getRouteTitle } = useApp().router;

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

export function useSitemap() {
    const config = useConfig(),
        pages = Object.values(config.pages).filter(
            page => page.show_in_index !== false
        ),
        options = pages.filter(page => !page.list),
        models = pages.filter(page => page.list);

    return { options, models };
}

export function useSpinner() {
    const spinner = useSelector(getSelector('spinner'));
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

export function useIcon(icon) {
    const icons = useIconComponents();
    if (typeof icon === 'string') {
        if (icons[icon]) {
            return icons[icon];
        } else {
            return null;
        }
    } else if (typeof icon === 'function') {
        return icon;
    } else {
        return null;
    }
}

export function useViewComponents() {
    return usePluginComponentMap('react', 'views');
}

export function useApp() {
    return useContext(AppContext).app;
}

export function useConfig() {
    const app = useApp();
    return app.config;
}

export function useModel(name, filter) {
    const app = useApp(),
        model = app.models[name];

    if (!model) {
        throw new Error(`Unknown model name ${name}`);
    }

    const selector = useMemo(() => {
        let selector;
        if (
            typeof filter === 'function' ||
            (typeof filter === 'object' && !Array.isArray(filter))
        ) {
            // Filter by query
            selector = createSelector(model.orm, session =>
                model.getQuerySet(session).filter(filter).toRefArray()
            );
        } else if (filter) {
            // Filter by id (default ModelSelectorSpec behavior)
            selector = state => createSelector(model.orm[name])(state, filter);
        } else {
            // All objects (use getQuerySet() to leverage config.ordering)
            selector = createSelector(model.orm, session =>
                model.getQuerySet(session).toRefArray()
            );
        }
        return selector;
    }, [model, filter]);

    return useSelector(selector);
}

function selectOutbox(state) {
    return state.offline.outbox;
}

export function useOutbox() {
    const outbox = useSelector(selectOutbox),
        {
            outbox: { parseOutbox }
        } = useApp();
    return useMemo(() => {
        if (outbox) {
            return parseOutbox(outbox);
        } else {
            return [];
        }
    }, [outbox, parseOutbox]);
}

export function useUnsynced(modelConf) {
    const outbox = useOutbox(),
        {
            outbox: { filterUnsynced }
        } = useApp();
    return useMemo(() => {
        return filterUnsynced(outbox, modelConf);
    }, [outbox, modelConf]);
}

export function useList(routeName) {
    const { list: contextList, show_unsynced } = useRenderContext(routeName),
        { page_config } = useRouteInfo(routeName),
        modelList = useModel(page_config.page),
        unsynced = useUnsynced(page_config);

    return useMemo(() => {
        let list;
        if (show_unsynced) {
            // Context list should generally already equal model list, unless
            // there has been a sync or other model update since last RENDER.
            const seen = {};
            modelList.forEach(row => (seen[row.id] = true));
            list = modelList.concat(
                (contextList || []).filter(row => !seen[row.id])
            );
        } else {
            // Context list probably came directly from server, ignore local model
            list = contextList || [];
        }
        const empty = !list || !list.length;

        return {
            page_config,
            list,
            unsynced: show_unsynced ? unsynced : [],
            empty
        };
    }, [contextList, show_unsynced, page_config, modelList, unsynced]);
}

export function usePlugin(name) {
    const { plugins } = useApp();
    return plugins[name];
}

export function usePluginComponentMap(pluginName, mapName, paramCaseOnly) {
    const plugin = usePlugin(pluginName) || {},
        { registry = {} } = plugin,
        { [mapName]: componentMap = {} } = registry;

    const result = paramCaseOnly ? {} : componentMap;
    Object.entries(componentMap).forEach(([key, val]) => {
        result[paramCase(key)] = val;
    });
    return result;
}

export function usePluginState(name) {
    const plugin = usePlugin(name),
        pluginState = useSelector(getSelector(name));

    if (plugin) {
        return pluginState;
    } else {
        return null;
    }
}

export function usePluginReducer(name) {
    const plugin = usePlugin(name),
        pluginState = useSelector(getSelector(name));

    if (plugin) {
        return [pluginState, plugin];
    } else {
        return [null, null];
    }
}

export function usePluginContent() {
    const app = useApp(),
        components = useComponents();

    const content = useMemo(
        () =>
            Object.values(app.plugins)
                .map(plugin => plugin.runComponent)
                .map(name => (name ? components[name] : null))
                .filter(component => !!component),
        [app]
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

export function useValidate() {
    const app = useApp();
    return useCallback(
        (values, modelConf) => app.outbox.validate(values, modelConf),
        [app]
    );
}
