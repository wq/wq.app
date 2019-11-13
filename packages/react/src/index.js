import React from 'react';
import ReactDOM from 'react-dom';
import { Provider as StoreProvider } from 'react-redux';
import { AppContext } from './hooks';

import App from './App';
import {
    Container,
    Header,
    Footer,
    Main,
    Spinner,
    Link,
    Breadcrumbs,
    DebugContext
} from './components/index';

import {
    Index,
    List,
    Placeholder,
    Loading,
    Other,
    NotFound,
    Server
} from './views/index';

export default {
    name: 'react',
    type: 'renderer',

    config: {
        components: {
            App,
            Container,
            Header,
            Footer,
            Main,
            Spinner,
            Link,
            Breadcrumbs,
            DebugContext
        },
        views: {
            // Common pages
            index: Index,
            login: Placeholder,
            logout: Placeholder,
            outbox: Placeholder,

            // Generic @wq/app routes
            '*_list': List,
            '*_detail': Placeholder,
            '*_edit': Placeholder,
            '*_*': Placeholder,
            other: Other,

            // Fallback views
            '404': NotFound,
            server: Server,
            loading: Loading
        }
    },

    init(config) {
        Object.values(this.app.plugins).forEach(plugin => {
            if (plugin.views) {
                Object.assign(this.config.views, plugin.views);
            }
            if (plugin.components) {
                Object.assign(this.config.components, plugin.components);
            }
        });
        if (config) {
            if (config.views) {
                config.views = {
                    ...this.config.views,
                    ...config.views
                };
            }
            if (config.components) {
                config.components = {
                    ...this.config.components,
                    ...config.components
                };
            }
            Object.assign(this.config, config);
        }
        if (!this.root) {
            this.root = document.body.appendChild(
                document.createElement('div')
            );
            this.root.id = 'wq-app-root';
        }
    },

    getRootComponent() {
        const { components, views } = this.config,
            { App } = components;
        const AppRoot = () => (
            <StoreProvider store={this.app.store._store}>
                <AppContext.Provider
                    value={{ app: this.app, components, views }}
                >
                    <App />
                </AppContext.Provider>
            </StoreProvider>
        );
        AppRoot.displayName = 'AppRoot';
        return AppRoot;
    },

    start() {
        const RootComponent = this.getRootComponent();
        ReactDOM.render(<RootComponent />, this.root);
    },

    createInstance(component, root, app) {
        if (!app) {
            app = this.app;
        }
        const tempPlugin = {
            app,
            config: {
                views: {},
                components: {}
            },
            getRootComponent: () => this.getRootComponent.call(tempPlugin),
            root
        };
        this.init.call(tempPlugin);
        tempPlugin.config.components.App = component;

        return {
            start: () => this.start.call(tempPlugin),
            getRootComponent: () => tempPlugin.getRootComponent(),
            stop: () => ReactDOM.unmountComponentAtNode(root)
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
