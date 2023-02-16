import React from "react";
import { useIcon } from "@wq/react";
import { IconButton as MuiIconButton } from "@mui/material";
import PropTypes from "prop-types";

export default function IconButton({ icon, size = "large", ...rest }) {
    const Icon = useIcon(icon);
    if (!Icon) {
        throw new Error(`"${icon}" is not a registered icon!`);
    }
    return (
        <MuiIconButton size={size} {...rest}>
            <Icon />
        </MuiIconButton>
    );
}

IconButton.propTypes = {
    icon: PropTypes.string,
    size: PropTypes.string,
};
