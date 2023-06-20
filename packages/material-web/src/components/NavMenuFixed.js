import React from "react";
import { useViewComponents, useRouteInfo } from "@wq/react";
import { useMinWidth } from "../hooks.js";
import { Box } from "@mui/material";

export default function NavMenuFixed() {
    const { NavMenu, Index } = useViewComponents(),
        { name } = useRouteInfo(),
        fixedMenu = useMinWidth(480);
    if (!fixedMenu) {
        return null;
    }
    if (name === "index" && NavMenu === Index) {
        return null;
    }
    return (
        <Box
            sx={{
                minWidth: 180,
                width: "25%",
                maxWidth: 360,
                display: "flex",
                flexDirection: "column",
                borderRightWidth: 1,
                borderRightStyle: "solid",
                borderRightColor: "divider",
            }}
        >
            <NavMenu />
        </Box>
    );
}
