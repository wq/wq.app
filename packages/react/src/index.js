import React from 'react';
import { Provider as StoreProvider } from 'react-redux';
import { AppContext } from './hooks';

import App from './App';

import * as components from './components/index';
import * as inputs from './components/inputs/index';
import * as icons from './components/icons/index';
import * as views from './components/views/index';
import { init, start, unmount } from './init';

export default {
    name: 'react',
    type: 'renderer',

    config: {
        components: {
            App,
            ...components
        },
        inputs: { ...inputs },
        icons: { ...icons },
        views: { ...views }
    },

    init(config) {
        if (config) {
            Object.assign(this.config, config);
        }
        Object.values(this.app.plugins).forEach(plugin => {
            if (plugin.components) {
                Object.assign(this.config.components, plugin.components);
            }
            if (plugin.inputs) {
                Object.assign(this.config.inputs, plugin.inputs);
            }
            if (plugin.icons) {
                Object.assign(this.config.icons, plugin.icons);
            }
            if (plugin.views) {
                Object.assign(this.config.views, plugin.views);
            }
        });
        init.call(this);
    },

    getRootComponent() {
        const { app, config } = this,
            { components } = config,
            { App } = components;
        const AppRoot = () => (
            <StoreProvider store={this.app.store._store}>
                <AppContext.Provider value={{ app }}>
                    <App />
                </AppContext.Provider>
            </StoreProvider>
        );
        AppRoot.displayName = 'AppRoot';
        return AppRoot;
    },

    start,

    createInstance(component, root, app) {
        if (!app) {
            app = this.app;
        }
        const tempPlugin = {
            app: {
                ...app,
                plugins: { ...app.plugins }
            },
            config: {
                components: {},
                inputs: {},
                icons: {},
                views: {}
            },
            root
        };

        this.init.call(tempPlugin);

        tempPlugin.app.plugins.react = tempPlugin;
        tempPlugin.config.components.App = component;

        return {
            start: () => this.start.call(tempPlugin),
            getRootComponent: () => this.getRootComponent.call(tempPlugin),
            stop: () => unmount.call(tempPlugin)
        };
    },

    attach(component, root, app) {
        const instance = this.createInstance(component, root, app);
        instance.start();
        return () => instance.stop();
    },

    wrap(component, app) {
        const emptyRoot = {},
            instance = this.createInstance(component, emptyRoot, app);
        return instance.getRootComponent();
    }
};
