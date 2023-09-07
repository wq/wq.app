import React, { useMemo } from "react";
import { App as DefaultApp, usePlugin } from "@wq/react";
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

export default function App() {
    const { theme: configTheme } = usePlugin("material").config,
        theme = useMemo(() => createTheme(configTheme), [configTheme]),
        options = useMemo(
            () => ({
                navigator: { theme },
                screen: {
                    cardStyle: { backgroundColor: theme.colors.background },
                },
            }),
            [theme]
        );

    return (
        <PaperProvider theme={theme}>
            <DefaultApp options={options} />
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
