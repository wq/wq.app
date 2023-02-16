import React from "react";
import { useComponents } from "../hooks.js";
import PropTypes from "prop-types";

export default function ListItemLink({ children, icon, description, ...rest }) {
    const { ListItem, Link } = useComponents();
    return (
        <ListItem icon={icon} description={description}>
            <Link {...rest}>{children}</Link>
        </ListItem>
    );
}

ListItemLink.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string,
};
