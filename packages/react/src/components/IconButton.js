import React from "react";
import { useIcon } from "../hooks.js";
import PropTypes from "prop-types";

export default function IconButton({ icon, type = "button", ...rest }) {
    const Icon = useIcon(icon);
    return (
        <button type={type} {...rest}>
            <Icon />
        </button>
    );
}

IconButton.propTypes = {
    icon: PropTypes.string,
    type: PropTypes.string,
};
