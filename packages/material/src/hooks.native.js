import { createRef, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useApp, usePlugin, useRoutesMap } from '@wq/react';
import { pathToAction } from 'redux-first-router';

export const navRef = createRef();

export function nav(to, routesMap, navigation, store) {
    const action = typeof to === 'string' ? pathToAction(to, routesMap) : to;
    const { type, payload } = action;
    navigation.navigate(type, payload);
    store.dispatch(action);
}

export function useOnPress(to) {
    const navigation = useNavigation(),
        app = useApp(),
        routesMap = useRoutesMap();

    return () => nav(to, routesMap, navigation, app.store);
}

export function useCreateNavigator(theme) {
    const config = usePlugin('material').config;
    const createNavigator = config.createNavigator || createDefaultNavigator;
    return useMemo(() => {
        return createNavigator(theme);
    }, [createNavigator, theme]);
}

function createDefaultNavigator() {
    return createStackNavigator();
}
