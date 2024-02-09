import React, { useState } from "react";
import { AppBar, Toolbar, Typography } from "@mui/material";
import { useSiteTitle, useBreadcrumbs, useComponents } from "@wq/react";
import { useMinWidth } from "../hooks.js";

export default function Header() {
    const title = useSiteTitle(),
        links = useBreadcrumbs(),
        { Logo, SiteTitle, Breadcrumbs, IconButton, NavMenuPopup } =
            useComponents(),
        fixedMenu = useMinWidth(600),
        [open, setOpen] = useState(false);
    return (
        <>
            <AppBar position="static" sx={{ zIndex: 500 }}>
                <Toolbar>
                    {fixedMenu ? (
                        <Logo edge="start" />
                    ) : (
                        <IconButton
                            icon="menu"
                            sx={{ mr: 2 }}
                            onClick={() => setOpen(true)}
                            color="inherit"
                            edge="start"
                        />
                    )}
                    <Typography variant="h6">
                        <SiteTitle title={title} />
                    </Typography>
                </Toolbar>
            </AppBar>
            <Breadcrumbs links={links} />
            {!fixedMenu && (
                <NavMenuPopup open={open} onClose={() => setOpen(false)} />
            )}
        </>
    );
}
