import React from "react";
import { Drawer } from "@mui/material";
import PropTypes from "prop-types";

export default function Popup({
    anchor = "bottom",
    children,
    open,
    onClose,
    ...rest
}) {
    return (
        <Drawer anchor={anchor} open={open} onClose={onClose} {...rest}>
            {children}
        </Drawer>
    );
}

Popup.propTypes = {
    anchor: PropTypes.string,
    children: PropTypes.node,
    open: PropTypes.bool,
    onClose: PropTypes.func,
};
