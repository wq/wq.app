import React, { useEffect, useMemo } from "react";
import { Root as DefaultRoot } from "@wq/react";
import { usePathname, useSegments, useGlobalSearchParams } from "expo-router";
import {
    MD2LightTheme,
    MD3LightTheme,
    MD2DarkTheme,
    MD3DarkTheme,
    Provider as PaperProvider,
} from "react-native-paper";

const THEMES = {
    "light-2": MD2LightTheme,
    "light-3": MD3LightTheme,
    "dark-2": MD2DarkTheme,
    "dark-3": MD3DarkTheme,
};

export default function Root({ app, children }) {
    const pathname = usePathname(),
        segments = useSegments(),
        params = useGlobalSearchParams(),
        { theme: configTheme } = app.plugins.material.config,
        theme = useMemo(() => createTheme(configTheme), [configTheme]);

    useEffect(() => {
        app.router.setRouteInfo({ pathname, segments, params });
    }, [pathname, segments, params]);

    return (
        <PaperProvider theme={theme}>
            <DefaultRoot app={app}>{children}</DefaultRoot>
        </PaperProvider>
    );
}

function createTheme({
    type = "light",
    version = 3,
    primary,
    secondary,
    background,
}) {
    const colors = {},
        base = THEMES[`${type}-${version}`];
    if (!base) {
        console.warn(`Unknown base theme type=${type} version=${version}`);
    }
    if (primary) {
        colors.primary = primary;
    }
    if (secondary) {
        colors.accent = secondary;
    }
    if (background) {
        colors.background = background;
    }
    return {
        ...base,
        colors: {
            ...(base || {}).colors,
            ...colors,
        },
    };
}
