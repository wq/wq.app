import React from "react";
import { useViewComponents, useRouteInfo } from "@wq/react";
import { useMinWidth } from "../hooks.js";
import { Paper } from "@mui/material";

export default function NavMenuFixed() {
    const { NavMenu, Index } = useViewComponents(),
        { name } = useRouteInfo(),
        fixedMenu = useMinWidth(600);
    if (!fixedMenu) {
        return null;
    }
    if (name === "index" && NavMenu === Index) {
        return null;
    }
    return (
        <Paper
            elevation={2}
            square
            sx={{
                minWidth: 180,
                width: "25%",
                maxWidth: 360,
                display: "flex",
                flexDirection: "column",
                zIndex: 600,
            }}
        >
            <NavMenu />
        </Paper>
    );
}
