import React from 'react';
import { useContextTitle, useComponents, useBreadcrumbs } from '../hooks';

export default function Header() {
    const title = useContextTitle(),
        links = useBreadcrumbs(),
        { Breadcrumbs } = useComponents();
    return (
        <header>
            <h1>{title}</h1>
            <Breadcrumbs links={links} />
        </header>
    );
}
