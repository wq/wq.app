import React, { useState } from "react";
import { AppRegistry } from "react-native";
import { navRef, nav } from "./hooks.native.js";

export function init() {
    const { router, store } = this.app;
    router.push = (to) => nav(to, router.routesMap, navRef.current, store);
    AppRegistry.registerComponent("main", () => RootWrapper);
}

var _setRoot, _Root;

export function start() {
    const { store } = this.app;
    _Root = () => this.getRootComponent();
    if (_setRoot) {
        _setRoot(_Root);
    }
    store.dispatch({ type: "INDEX" });
}

function RootWrapper() {
    const [Root, setRoot] = useState(_Root);
    _setRoot = setRoot;

    if (Root) {
        return <Root />;
    } else {
        return null;
    }
}

export function unmount() {}
