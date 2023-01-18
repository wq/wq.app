import React from "react";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
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
