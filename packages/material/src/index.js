import React from 'react';
import ReactDOM from 'react-dom';

import { Provider as StoreProvider } from 'react-redux';

import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import { ComponentConfig } from './hooks';

import App from './App';
import {
    Header,
    Footer,
    Main,
    Spinner,
    Link,
    ButtonLink,
    ListItemLink,
    Breadcrumbs,
    Pagination
} from './components/index';
import {
    List,
    Detail,
    Edit,
    Other,
    NotFound,
    Server,
    Loading,
    Index,
    Login,
    Logout,
    Outbox
} from './views/index';

export default {
    name: 'muirenderer',
    type: 'renderer',

    config: {
        theme: {},
        rootComponent: App,
        components: {
            Header,
            Footer,
            Main,
            Spinner,
            Link,
            ButtonLink,
            ListItemLink,
            Breadcrumbs,
            Pagination
        },
        views: {
            // Common pages
            index: Index,
            login: Login,
            logout: Logout,
            outbox: Outbox,

            // Generic @wq/app routes
            '*_list': List,
            '*_detail': Detail,
            '*_edit': Edit,
            '*_*': Detail,
            other: Other,

            // Fallback views
            '404': NotFound,
            server: Server,
            loading: Loading
        }
    },

    init(config) {
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
        this.root = document.body.appendChild(document.createElement('div'));
        this.root.id = 'wq-app-root';
    },

    start() {
        const { theme, components, views, rootComponent: App } = this.config;
        ReactDOM.render(
            <StoreProvider store={this.app.store._store}>
                <ThemeProvider theme={createMuiTheme(theme)}>
                    <CssBaseline />
                    <ComponentConfig.Provider value={{ components, views }}>
                        <App />
                    </ComponentConfig.Provider>
                </ThemeProvider>
            </StoreProvider>,
            this.root
        );
    }
};
