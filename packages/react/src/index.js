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
    Button,
    ButtonLink,
    Breadcrumbs,
    DebugContext,
    AutoForm,
    AutoInput,
    AutoSubform,
    AutoSubformArray,
    Form,
    FormRoot,
    FormActions,
    FormError,
    Fieldset,
    SubmitButton
} from './components/index';

import { Input, Select, Radio, Toggle } from './components/inputs/index';

import {
    Index,
    Login,
    Logout,
    OutboxList,
    List,
    Detail,
    Edit,
    Placeholder,
    Loading,
    Other,
    NotFound,
    Server
} from './components/views/index';

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
            Button,
            ButtonLink,
            Breadcrumbs,
            DebugContext,

            AutoForm,
            AutoInput,
            AutoSubform,
            AutoSubformArray,
            Form,
            FormRoot,
            FormActions,
            FormError,
            Fieldset,
            SubmitButton
        },
        inputs: {
            Input,
            Select,
            Radio,
            Toggle
        },
        views: {
            // Common pages
            Index,
            Login,
            Logout,
            OutboxList,

            // Generic @wq/app routes
            '*_list': List,
            '*_detail': Detail,
            '*_edit': Edit,
            '*_*': Placeholder,
            Other,

            // Fallback views
            '404': NotFound,
            Server,
            Loading
        }
    },

    init(config) {
        Object.values(this.app.plugins).forEach(plugin => {
            if (plugin.views) {
                Object.assign(this.config.views, plugin.views);
            }
            if (plugin.inputs) {
                Object.assign(this.config.inputs, plugin.inputs);
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
            if (config.inputs) {
                config.inputs = {
                    ...this.config.inputs,
                    ...config.inputs
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

    start() {
        const RootComponent = this.getRootComponent();
        ReactDOM.render(<RootComponent />, this.root);
    },

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
                views: {},
                inputs: {},
                components: {}
            },
            root
        };

        this.init.call(tempPlugin);

        tempPlugin.app.plugins.react = tempPlugin;
        tempPlugin.config.components.App = component;

        return {
            start: () => this.start.call(tempPlugin),
            getRootComponent: () => this.getRootComponent.call(tempPlugin),
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
