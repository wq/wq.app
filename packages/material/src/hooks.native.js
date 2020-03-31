import { createRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useApp, useRoutesMap } from '@wq/react';
import { pathToAction } from 'redux-first-router';
import 'expo/build/Expo.fx';
import registerRootComponent from 'expo/build/launch/registerRootComponent';

export const navRef = createRef();

export function init(config) {
    const {
        router,
        store,
        plugins: { react }
    } = this.app;
    react.start = () => null;
    router.push = to => nav(to, router.routesMap, navRef.current, store);
    if (config) {
        Object.assign(this.config, config);
    }
}

export function start() {
    const {
        store,
        plugins: { react }
    } = this.app;
    registerRootComponent(react.getRootComponent());
    store.dispatch({ type: 'INDEX' });
}

function nav(to, routesMap, navigation, store) {
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