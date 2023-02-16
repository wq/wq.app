import React, { useMemo } from "react";
import { App as DefaultApp, usePlugin } from "@wq/react";
import {
    createTheme as createMuiTheme,
    ThemeProvider,
    CssBaseline,
} from "@mui/material";

export default function App() {
    const { theme } = usePlugin("material").config,
        muiTheme = useMemo(() => createTheme(theme), [theme]);
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <DefaultApp />
        </ThemeProvider>
    );
}

function createTheme(theme) {
    const { type, primary, secondary, background } = theme;
    const palette = theme.palette || {};
    if (type) {
        palette.mode = type;
    }
    if (primary) {
        palette.primary = { main: primary };
    }
    if (secondary) {
        palette.secondary = { main: secondary };
    }
    if (background) {
        palette.background = { paper: background };
    }
    return createMuiTheme({ palette });
}
