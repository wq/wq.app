import React, { useState, useEffect } from "react";
import { useComponents } from "@wq/react";
import Drawer from "@mui/material/Drawer";
import useMediaQuery from "@mui/material/useMediaQuery";
import PropTypes from "prop-types";

export default function SidePanel({ children, compactChildren, onChange }) {
    const mobile = useMediaQuery((theme) => theme.breakpoints.down("md")),
        [open, setOpen] = useState(!mobile),
        { IconButton } = useComponents();

    useEffect(() => {
        if (onChange) {
            onChange(open);
        }
    }, [open, onChange]);

    return (
        <Drawer
            variant="permanent"
            style={mobile && !open ? { position: "absolute" } : {}}
            PaperProps={{
                style: {
                    width: open ? 280 : 50,
                    borderBottom:
                        mobile && !open && "1px solid rgba(0, 0, 0, 0.12)",
                    position: "relative",
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
                    <div style={{ flex: 1 }} />
                    <div style={{ backgroundColor: "white" }}>
                        <IconButton
                            icon="panel-close"
                            onClick={() => setOpen(false)}
                        />
                    </div>
                </div>
            ) : (
                <IconButton icon="panel-open" onClick={() => setOpen(true)} />
            )}
            {open ? children : compactChildren}
        </Drawer>
    );
}

SidePanel.propTypes = {
    children: PropTypes.node,
    compactChildren: PropTypes.node,
    onChange: PropTypes.func,
};
