import React from "react";
import orm from "@wq/model";
import { Provider as StoreProvider } from "react-redux";
import { AppContext } from "./hooks.js";

import messages from "./messages.js";
import * as components from "./components/index.js";
import * as inputs from "./inputs/index.js";
import * as icons from "./icons.js";
import * as views from "./views/index.js";
import validate from "./validate.js";

export default {
    name: "react",
    type: "renderer",
    dependencies: [orm],

    config: {
        messages: { ...messages },
    },

    registry: {
        components: { ...components },
        inputs: { ...inputs },
        icons: { ...icons },
        views: { ...views },
    },

    setEngine({ init, start, unmount, App }) {
        this.engine = { init, start, unmount };
        this.registry.components.App = App;
    },

    init(config) {
        if (!this.engine) {
            throw new Error("Missing react engine!");
        }
        if (config) {
            Object.assign(this.config, config);
        }
        Object.values(this.app.plugins).forEach((plugin) => {
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
        this.engine.init.call(this);
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
        AppRoot.displayName = "AppRoot";
        return AppRoot;
    },

    start() {
        this.engine.start.call(this);
    },
    validate,

    createInstance(component, root, app) {
        if (!app) {
            app = this.app;
        }
        const tempPlugin = {
            app: {
                ...app,
                plugins: { ...app.plugins },
            },
            config: { messages: {} },
            engine: this.engine,
            registry: {
                components: {},
                inputs: {},
                icons: {},
                views: {},
            },
            root,
            getRootComponent: this.getRootComponent,
        };

        this.init.call(tempPlugin);

        tempPlugin.app.plugins.react = tempPlugin;
        tempPlugin.registry.components.App = component;

        return {
            start: () => this.start.call(tempPlugin),
            getRootComponent: () => tempPlugin.getRootComponent(),
            stop: () => this.engine.unmount.call(tempPlugin),
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
    },
};

export * from "./views/index.js";

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
    ForeignKeyLink,
    ManyToManyLink,
    RelatedLinks,
    DebugContext,
} = components;

const autoFormData = AutoForm.initData;

export {
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
    ForeignKeyLink,
    ManyToManyLink,
    RelatedLinks,
    DebugContext,
    autoFormData,
};

const { ForeignKey } = inputs;

export { ForeignKey };
