import React from 'react';
import { useTitle, useComponents } from '../hooks';

export default function Header() {
    const title = useTitle(),
        { Breadcrumbs } = useComponents();
    return (
        <header>
            <h1>{title}</h1>
            <Breadcrumbs />
        </header>
    );
}
