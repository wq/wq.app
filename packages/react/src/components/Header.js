import React from "react";
import { useSiteTitle, useComponents, useBreadcrumbs } from "../hooks.js";

export default function Header() {
    const title = useSiteTitle(),
        links = useBreadcrumbs(),
        { Breadcrumbs } = useComponents();
    return (
        <header>
            <h1>{title}</h1>
            <Breadcrumbs links={links} />
        </header>
    );
}
