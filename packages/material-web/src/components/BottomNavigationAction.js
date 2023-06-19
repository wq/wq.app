import React from "react";
import { BottomNavigationAction as MuiBottomNavigationAction } from "@mui/material";
import { Link } from "@wq/react";
import PropTypes from "prop-types";
import { useIcon } from "@wq/react";

export default function BottomNavigationAction({ icon, to, ...rest }) {
    const Icon = useIcon(icon);
    return (
        <MuiBottomNavigationAction
            component={to && Link}
            icon={Icon && <Icon />}
            to={to}
            {...rest}
        />
    );
}

BottomNavigationAction.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
