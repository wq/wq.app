import React from 'react';
import { App as DefaultApp, usePlugin } from '@wq/react';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';

export default function App() {
    const { theme } = usePlugin('material').config;
    return (
        <ThemeProvider theme={createMuiTheme(theme)}>
            <CssBaseline />
            <DefaultApp />
        </ThemeProvider>
    );
}
