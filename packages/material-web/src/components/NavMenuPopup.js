import React from "react";
import { Drawer, AppBar, Toolbar, Typography } from "@mui/material";
import { useViewComponents, useComponents, useSiteTitle } from "@wq/react";

export default function NavMenuPopup({ open, onClose }) {
    const title = useSiteTitle(),
        { NavMenu } = useViewComponents(),
        { Logo } = useComponents();
    return (
        <Drawer
            open={open}
            onClose={onClose}
            anchor="left"
            keepMounted
            PaperProps={{ style: { maxWidth: "80%", width: 500 } }}
        >
            <AppBar
                position="static"
                color="default"
                style={{ borderBottom: "1px solid #999" }}
            >
                <Toolbar variant="regular">
                    <Logo edge="start" />
                    <Typography variant="h6">{title}</Typography>
                </Toolbar>
            </AppBar>
            <NavMenu onNavigate={onClose} />
        </Drawer>
    );
}
