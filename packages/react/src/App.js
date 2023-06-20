import React from "react";
import {
    RouteContext,
    useRenderContext,
    useRouteInfo,
    useComponents,
    useViewComponents,
    usePluginContent,
} from "./hooks.js";
import PropTypes from "prop-types";

const HTML = "@@HTML", // @wq/router
    CURRENT = "@@CURRENT"; // @wq/router

export default function App({ route }) {
    if (!route) {
        route = CURRENT;
    }
    return (
        <RouteContext.Provider value={{ name: route }}>
            <AppLayout showHeader={route === CURRENT} />
        </RouteContext.Provider>
    );
}
App.propTypes = {
    route: PropTypes.string,
};

function AppLayout({ showHeader }) {
    const context = useRenderContext(),
        routeInfo = useRouteInfo(),
        views = useViewComponents(),
        PluginContent = usePluginContent(),
        { Container, Header, NavMenuFixed, Footer, Main, Spinner } =
            useComponents();

    let name;
    if (routeInfo.pending) {
        name = "loading";
    } else if (context[HTML]) {
        name = "server";
    } else if (views[routeInfo.template]) {
        name = routeInfo.template;
    } else if (
        typeof routeInfo.template === "string" &&
        views[routeInfo.template.replace("_", "-")]
    ) {
        name = routeInfo.template.replace("_", "-");
    } else if (views[routeInfo.name]) {
        name = routeInfo.name;
    } else if (routeInfo.mode) {
        const { page, mode } = routeInfo,
            names = [
                `${page}_${mode}`,
                `${page}-${mode}`,
                `default-${mode}`,
                "default",
            ];
        name = names.find((name) => views[name]);
    } else {
        name = "default";
    }

    const View = views[name];
    if (!View) {
        return (
            <Container>
                {`Missing ${name} view!`}
                <Spinner />
            </Container>
        );
    }

    if (View.fullscreen) {
        return (
            <Container>
                <View />
                <PluginContent />
                <Spinner />
            </Container>
        );
    } else {
        return (
            <Container>
                {showHeader && <Header />}
                <Main>
                    <NavMenuFixed />
                    <View />
                    <PluginContent />
                </Main>
                <Footer />
                <Spinner />
            </Container>
        );
    }
}
AppLayout.propTypes = {
    showHeader: PropTypes.bool,
};
