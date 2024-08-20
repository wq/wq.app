import React, { useMemo } from "react";
import { Root as DefaultRoot, usePlugin } from "@wq/react";
import {
    createTheme as createMuiTheme,
    ThemeProvider,
    CssBaseline,
} from "@mui/material";

export default function Root({ app, children }) {
    const { theme } = usePlugin("material").config,
        muiTheme = useMemo(() => createTheme(theme), [theme]);
    return (
        <ThemeProvider theme={muiTheme}>
            <CssBaseline />
            <Root app={app}>{children}</Root>
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
