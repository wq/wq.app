import React from "react";
import { Tab as MuiTab } from "@mui/material";
import { Link } from "@wq/react";
import PropTypes from "prop-types";
import { useIcon } from "@wq/react";

export default function TabItem({ icon, to, children, ...rest }) {
    /* eslint no-unused-vars: off */
    const Icon = useIcon(icon);
    return (
        <MuiTab
            component={to && Link}
            icon={Icon && <Icon />}
            to={to}
            {...rest}
        />
    );
    // children rendered by TabGroup
}

TabItem.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    children: PropTypes.node,
};
