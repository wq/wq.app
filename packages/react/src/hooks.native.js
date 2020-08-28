import { createRef, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useApp, usePlugin, useRoutesMap } from './hooks.js';
import { pathToAction } from 'redux-first-router';

export * from './hooks.js';

export const navRef = createRef();

export function nav(to, routesMap, navigation, store) {
    const action = typeof to === 'string' ? pathToAction(to, routesMap) : to;
    const { type, payload } = action;
    navigation.navigate(type, payload);
    store.dispatch(action);
}

export function useNav(to) {
    const navigation = useNavigation(),
        app = useApp(),
        routesMap = useRoutesMap();

    return useMemo(() => {
        function navfn(path) {
            return nav(path, routesMap, navigation, app.store);
        }
        return to ? navfn.bind(null, to) : navfn;
    }, [navigation, app, routesMap, to]);
}

export function useNavigationProps() {
    const config = usePlugin('react').config;
    return config.navigationProps || {};
}

export function useCreateNavigator(options) {
    const config = usePlugin('react').config;
    const createNavigator = config.createNavigator || createDefaultNavigator;
    return useMemo(() => {
        return createNavigator(options);
    }, [createNavigator, options]);
}

function createDefaultNavigator() {
    return createStackNavigator();
}
