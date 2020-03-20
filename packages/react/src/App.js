import React from 'react';
import {
    RouteContext,
    useRenderContext,
    useRouteInfo,
    useComponents,
    useViewComponents,
    usePluginContent
} from './hooks';
import PropTypes from 'prop-types';

const HTML = '@@HTML', // @wq/router
    CURRENT = '@@CURRENT'; // @wq/router

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
    route: PropTypes.string
};

function AppLayout({ showHeader }) {
    const context = useRenderContext(),
        routeInfo = useRouteInfo(),
        views = useViewComponents(),
        PluginContent = usePluginContent(),
        { Container, Header, Footer, Main, Spinner } = useComponents();

    let name;
    if (routeInfo.pending) {
        name = 'loading';
    } else if (context[HTML]) {
        name = 'server';
    } else if (views[routeInfo.template]) {
        name = routeInfo.template;
    } else if (views[routeInfo.template.replace('_', '-')]) {
        name = routeInfo.template.replace('_', '-');
    } else if (views[routeInfo.name]) {
        name = routeInfo.name;
    } else if (routeInfo.mode) {
        const { page, mode } = routeInfo,
            names = [
                `${page}_${mode}`,
                `${page}-${mode}`,
                `default-${mode}`,
                'placeholder'
            ];
        name = names.find(name => views[name]);
    } else {
        name = 'other';
    }

    const View = views[name];
    if (!View) {
        return <Container>{`Missing ${name} view!`}</Container>;
    }

    if (View.fullscreen) {
        return (
            <Container>
                <View />
                <Spinner />
            </Container>
        );
    } else {
        return (
            <Container>
                {showHeader && <Header />}
                <Main>
                    <View />
                    {!routeInfo.pending && <PluginContent />}
                </Main>
                <Footer />
                <Spinner />
            </Container>
        );
    }
}
AppLayout.propTypes = {
    showHeader: PropTypes.bool
};
