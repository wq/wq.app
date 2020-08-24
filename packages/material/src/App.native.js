import React, { useMemo } from 'react';
import { App as DefaultApp, usePlugin } from '@wq/react';
import {
    DefaultTheme,
    DarkTheme,
    Provider as PaperProvider
} from 'react-native-paper';

export default function App() {
    const { theme: configTheme } = usePlugin('material').config,
        theme = useMemo(() => createTheme(configTheme), [configTheme]),
        options = useMemo(
            () => ({
                navigator: { theme },
                screen: {
                    cardStyle: { backgroundColor: theme.colors.background }
                }
            }),
            [theme]
        );

    return (
        <PaperProvider theme={theme}>
            <DefaultApp options={options} />
        </PaperProvider>
    );
}

function createTheme({ type, primary, secondary, background }) {
    const colors = {},
        base = type === 'dark' ? DarkTheme : DefaultTheme;
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
            ...base.colors,
            ...colors
        }
    };
}
