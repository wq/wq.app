import React from "react";
import { Button as MuiButton } from "@mui/material";
import { useIcon } from "@wq/react";
import PropTypes from "prop-types";

export default function Button({ icon, ...rest }) {
    const Icon = useIcon(icon),
        startIcon = Icon ? <Icon /> : null;
    return <MuiButton startIcon={startIcon} {...rest} />;
}

Button.propTypes = {
    icon: PropTypes.string,
};
