import React, { useState, useEffect } from "react";
import { useComponents } from "@wq/react";
import { View } from "react-native";
import { useTheme } from "react-native-paper";
import { useMinWidth } from "../hooks.js";
import PropTypes from "prop-types";

export default function SidePanel({
    anchor: anchorSpec = "top-left",
    children,
    compactChildren,
    onChange,
}) {
    const mobile = !useMinWidth(900),
        theme = useTheme(),
        anchor = anchorSpec.endsWith("right") ? "right" : "left",
        vAnchor = anchorSpec.startsWith("bottom") ? "bottom" : "top",
        [open, setOpen] = useState(!mobile),
        { IconButton } = useComponents(),
        drawerStyle = {},
        iconStyle = {};

    drawerStyle.zIndex = 1000;
    drawerStyle.width = open ? 280 : 50;
    drawerStyle.borderColor = "rgba(0, 0, 0, 0.12)";

    if (mobile && !open) {
        drawerStyle.backgroundColor = theme.colors.background;
        drawerStyle.position = "absolute";
        if (vAnchor === "bottom") {
            drawerStyle.bottom = 0;
            drawerStyle.borderTopWidth = 1;
        } else {
            drawerStyle.top = 0;
            drawerStyle.borderBottomWidth = 1;
        }
        if (anchor === "right") {
            drawerStyle.right = 1;
        } else {
            drawerStyle.left = 1;
        }
    }

    if (anchor === "right") {
        iconStyle.transform = [{ rotate: "180deg" }];
        drawerStyle.borderLeftWidth = 1;
    } else {
        drawerStyle.borderRightWidth = 1;
    }

    useEffect(() => {
        if (onChange) {
            onChange(open);
        }
    }, [open, onChange]);

    return (
        <View style={drawerStyle}>
            {open ? (
                <View
                    style={{
                        display: "flex",
                        flexDirection: "row",
                        position: "sticky",
                        top: 0,
                        zIndex: 100,
                    }}
                >
                    {anchor === "left" && <View style={{ flex: 1 }} />}
                    <IconButton
                        icon="panel-close"
                        style={iconStyle}
                        onClick={() => setOpen(false)}
                    />
                    {anchor === "right" && <View style={{ flex: 1 }} />}
                </View>
            ) : (
                <IconButton
                    icon="panel-open"
                    style={iconStyle}
                    onClick={() => setOpen(true)}
                />
            )}
            {open ? children : compactChildren}
        </View>
    );
}

SidePanel.propTypes = {
    children: PropTypes.node,
    compactChildren: PropTypes.node,
    onChange: PropTypes.func,
    anchor: PropTypes.string,
};
