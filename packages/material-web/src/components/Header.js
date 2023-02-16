import React from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useSiteTitle, useBreadcrumbs, useComponents } from "@wq/react";

export default function Header() {
    const title = useSiteTitle(),
        links = useBreadcrumbs(),
        { Breadcrumbs } = useComponents();
    return (
        <>
            <AppBar position="static">
                <Toolbar>
                    <Typography variant="h6">{title}</Typography>
                </Toolbar>
            </AppBar>
            <Breadcrumbs links={links} />
        </>
    );
}
