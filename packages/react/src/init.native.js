import React, { useState } from 'react';
import { AppRegistry } from 'react-native';

export function init() {
    AppRegistry.registerComponent('main', () => RootWrapper);
}

var _setRoot, _Root;

export function start() {
    const { store } = this.app;
    _Root = () => this.getRootComponent();
    if (_setRoot) {
        _setRoot(_Root);
    }
    store.dispatch({ type: 'INDEX' });
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
