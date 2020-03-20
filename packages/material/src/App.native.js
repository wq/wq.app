import React, { useMemo } from 'react';
import {
    App as DefaultApp,
    useComponents,
    useRoutesMap,
    getTitle
} from '@wq/react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import PropTypes from 'prop-types';

const Stack = createStackNavigator();
import { navRef } from './hooks';

export default function App() {
    const { Header } = useComponents(),
        routesMap = useRoutesMap();

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

    return (
        <NavigationContainer ref={navRef}>
            <Stack.Navigator
                initialRouteName="INDEX"
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
                            title: getTitle(route.name)
                        })}
                        component={Screen}
                        route={route}
                    />
                ))}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

function Screen({ route }) {
    const { name } = route;
    return <DefaultApp route={name.toLowerCase()} />;
}
Screen.propTypes = {
    route: PropTypes.object
};
