import { createRef } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useRoutesMap } from '@wq/react';
import { pathToAction } from 'redux-first-router';
import 'expo/build/Expo.fx';
import registerRootComponent from 'expo/build/launch/registerRootComponent';

export const navRef = createRef();

export function init() {
    const {
        router,
        plugins: { react }
    } = this.app;
    react.root = {};
    react.start = () => null;
    router.push = to => nav(to, router.routesMap, navRef.current);
    // router._initialDispatch = () => {};
}

export function start() {
    const {
        store,
        plugins: { react }
    } = this.app;
    registerRootComponent(react.getRootComponent());
    store.dispatch({ type: 'INDEX' });
}

function nav(to, routesMap, navigation) {
    const action = typeof to === 'string' ? pathToAction(to, routesMap) : to;
    const { type, payload } = action;
    navigation.navigate(type, payload);
    window.wq.store.dispatch(action);
}

export function useOnPress(to) {
    const navigation = useNavigation(),
        routesMap = useRoutesMap();

    return () => nav(to, routesMap, navigation);
}
