import React from 'react';
import { useContextTitle, useComponents } from '../hooks';

export default function Header() {
    const title = useContextTitle(),
        { Breadcrumbs } = useComponents();
    return (
        <header>
            <h1>{title}</h1>
            <Breadcrumbs />
        </header>
    );
}
