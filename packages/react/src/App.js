import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useViewComponents,
    usePluginContent
} from './hooks';

const HTML = '@@HTML'; // @wq/router

export default function App() {
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
            names = [`${page}_${mode}`, `${page}-${mode}`, `*_${mode}`, '*_*'];
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
                <Header />
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
