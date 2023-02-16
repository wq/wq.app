import React, { useMemo } from "react";
import DefaultApp from "./App.js";
import {
    useComponents,
    useRoutesMap,
    useIndexRoute,
    useRouteTitle,
    navRef,
    useNavigationProps,
    useCreateNavigator,
} from "./hooks.native.js";
import { NavigationContainer } from "@react-navigation/native";
import PropTypes from "prop-types";

export default function App({ options = {} }) {
    const { Header } = useComponents(),
        { Navigator, Screen } = useCreateNavigator(options.navigator),
        navProps = useNavigationProps(),
        routesMap = useRoutesMap(),
        index = useIndexRoute(),
        routeTitle = useRouteTitle(),
        routes = useMemo(
            () =>
                Object.entries(routesMap)
                    .filter(
                        ([name, route]) => route.path && name !== "@@SERVER"
                    )
                    .map(([name, route]) => ({
                        name,
                        ...route,
                    })),
            [routesMap]
        );

    return (
        <NavigationContainer ref={navRef} {...navProps}>
            <Navigator
                initialRouteName={index.toUpperCase()}
                screenOptions={{
                    header: function header(props) {
                        return <Header {...props} />;
                    },
                }}
            >
                {routes.map((route) => (
                    <Screen
                        key={route.name}
                        name={route.name}
                        options={({ route }) => ({
                            title: routeTitle(route.name.toLowerCase()),
                            ...options.screen,
                        })}
                        component={AppScreen}
                        route={route}
                    />
                ))}
            </Navigator>
        </NavigationContainer>
    );
}

App.propTypes = {
    options: PropTypes.object,
};

function AppScreen({ route }) {
    const { name } = route;
    return <DefaultApp route={name.toLowerCase()} />;
}
AppScreen.propTypes = {
    route: PropTypes.object,
};
