import React from "react";
import { useIcon } from "../hooks.js";
import PropTypes from "prop-types";

export default function ListItem({ children, description, icon, ...rest }) {
    const Icon = useIcon(icon);
    return (
        <li {...rest}>
            {Icon && <Icon />}
            {children}
            {description && <small>{description}</small>}
        </li>
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
};
