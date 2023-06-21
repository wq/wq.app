import React, { useState, useEffect } from "react";
import { useComponents } from "@wq/react";
import { Drawer, useMediaQuery } from "@mui/material";
import PropTypes from "prop-types";

export default function SidePanel({
    anchor: anchorSpec = "top-left",
    children,
    compactChildren,
    onChange,
}) {
    const mobile = useMediaQuery((theme) => theme.breakpoints.down("md")),
        anchor = anchorSpec.endsWith("right") ? "right" : "left",
        vAnchor = anchorSpec.startsWith("bottom") ? "bottom" : "top",
        [open, setOpen] = useState(!mobile),
        { IconButton } = useComponents(),
        drawerStyle = {},
        iconStyle = {};

    if (mobile && !open) {
        drawerStyle.position = "absolute";
        if (vAnchor === "bottom") {
            drawerStyle.bottom = 0;
        } else {
            drawerStyle.top = 0;
        }
        if (anchor === "right") {
            drawerStyle.right = 0;
        } else {
            drawerStyle.left = 0;
        }
    }

    if (anchor === "right") {
        iconStyle.transform = "rotate(180deg)";
    }

    useEffect(() => {
        if (onChange) {
            onChange(open);
        }
    }, [open, onChange]);

    return (
        <Drawer
            variant="permanent"
            style={drawerStyle}
            anchor={anchor}
            PaperProps={{
                style: {
                    width: open ? 280 : 50,
                    borderBottom:
                        mobile && !open && "1px solid rgba(0, 0, 0, 0.12)",
                    position: "relative",
                    zIndex: 300,
                },
            }}
        >
            {open ? (
                <div
                    style={{
                        display: "flex",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    {anchor === "left" && <div style={{ flex: 1 }} />}
                    <div style={{ backgroundColor: "white" }}>
                        <IconButton
                            icon="panel-close"
                            style={iconStyle}
                            onClick={() => setOpen(false)}
                        />
                    </div>
                    {anchor === "right" && <div style={{ flex: 1 }} />}
                </div>
            ) : (
                <IconButton
                    icon="panel-open"
                    style={iconStyle}
                    onClick={() => setOpen(true)}
                />
            )}
            {open ? children : compactChildren}
        </Drawer>
    );
}

SidePanel.propTypes = {
    children: PropTypes.node,
    compactChildren: PropTypes.node,
    onChange: PropTypes.func,
    anchor: PropTypes.string,
};
