import React, { useMemo } from 'react';
import {
    App as DefaultApp,
    useComponents,
    useRoutesMap,
    useIndexRoute,
    useRouteTitle,
    usePlugin
} from '@wq/react';
import {
    DefaultTheme,
    DarkTheme,
    Provider as PaperProvider
} from 'react-native-paper';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PropTypes from 'prop-types';

const Stack = createStackNavigator();
import { navRef } from './hooks';

export default function App() {
    const { Header } = useComponents(),
        routesMap = useRoutesMap(),
        index = useIndexRoute(),
        routeTitle = useRouteTitle(),
        { theme } = usePlugin('material').config;

    const routes = useMemo(
        () =>
            Object.entries(routesMap)
                .filter(([name, route]) => route.path && name !== '@@SERVER')
                .map(([name, route]) => ({
                    name,
                    ...route
                })),
        [routesMap]
    );

    const paperTheme = useMemo(() => createTheme(theme), [theme]);

    return (
        <PaperProvider theme={paperTheme}>
            <NavigationContainer ref={navRef}>
                <Stack.Navigator
                    initialRouteName={index.toUpperCase()}
                    screenOptions={{
                        header: function header(props) {
                            return <Header {...props} />;
                        }
                    }}
                >
                    {routes.map(route => (
                        <Stack.Screen
                            key={route.name}
                            name={route.name}
                            options={({ route }) => ({
                                title: routeTitle(route.name.toLowerCase()),
                                cardStyle: {
                                    backgroundColor:
                                        paperTheme.colors.background
                                }
                            })}
                            component={Screen}
                            route={route}
                        />
                    ))}
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}

function Screen({ route }) {
    const { name } = route;
    return <DefaultApp route={name.toLowerCase()} />;
}
Screen.propTypes = {
    route: PropTypes.object
};

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
