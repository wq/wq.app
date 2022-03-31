import React from 'react';
import { Provider as StoreProvider } from 'react-redux';
import { AppContext } from './hooks';

import App from './App';

import messages from './messages';
import * as components from './components/index';
import * as inputs from './inputs/index';
import * as icons from './icons';
import * as views from './views/index';
import { init, start, unmount } from './init';
import validate from './validate';

export default {
    name: 'react',
    type: 'renderer',

    config: {
        messages: { ...messages }
    },

    registry: {
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
            if (plugin.messages) {
                Object.assign(this.config.messages, plugin.messages);
            }
            if (plugin.components) {
                Object.assign(this.registry.components, plugin.components);
            }
            if (plugin.inputs) {
                Object.assign(this.registry.inputs, plugin.inputs);
            }
            if (plugin.icons) {
                Object.assign(this.registry.icons, plugin.icons);
            }
            if (plugin.views) {
                Object.assign(this.registry.views, plugin.views);
            }
        });
        init.call(this);
    },

    getRootComponent() {
        const { app, registry } = this,
            { components } = registry,
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
    validate,

    createInstance(component, root, app) {
        if (!app) {
            app = this.app;
        }
        const tempPlugin = {
            app: {
                ...app,
                plugins: { ...app.plugins }
            },
            config: {},
            registry: {
                components: {},
                inputs: {},
                icons: {},
                views: {}
            },
            root,
            getRootComponent: this.getRootComponent
        };

        this.init.call(tempPlugin);

        tempPlugin.app.plugins.react = tempPlugin;
        tempPlugin.registry.components.App = component;

        return {
            start: () => this.start.call(tempPlugin),
            getRootComponent: () => tempPlugin.getRootComponent(),
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

export * from './hooks';
export * from './views/index';

const {
    Link,
    Message,
    Form,
    FormError,
    AutoForm,
    AutoInput,
    AutoSubform,
    AutoSubformArray,
    PropertyTable,
    ImagePreview,
    FileLink,
    DebugContext
} = components;

export {
    App,
    Message,
    Link,
    Form,
    FormError,
    AutoForm,
    AutoInput,
    AutoSubform,
    AutoSubformArray,
    PropertyTable,
    ImagePreview,
    FileLink,
    DebugContext
};
