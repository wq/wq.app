import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useViews,
    useComponents
} from './hooks';

const HTML = '@@HTML'; // @wq/router

export default function App() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo(),
        views = useViews(),
        { Container, Header, Footer, Main, Spinner } = useComponents();

    let name;
    if (routeInfo.pending) {
        name = 'loading';
    } else if (context[HTML]) {
        name = 'server';
    } else if (views[routeInfo.template]) {
        name = routeInfo.template;
    } else if (views[routeInfo.name]) {
        name = routeInfo.name;
    } else if (routeInfo.mode) {
        name = '*_' + routeInfo.mode;
        if (!views[name]) {
            name = '*_*';
        }
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
                </Main>
                <Footer />
                <Spinner />
            </Container>
        );
    }
}
