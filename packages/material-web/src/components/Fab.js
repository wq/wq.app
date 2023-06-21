import React from "react";
import { Fab as MuiFab } from "@mui/material";
import { Link } from "@wq/react";
import PropTypes from "prop-types";
import { useIcon } from "@wq/react";

export default function Fab({ icon, to, ...rest }) {
    const Icon = useIcon(icon);
    return (
        <MuiFab
            component={Link}
            to={to}
            color="primary"
            style={{
                position: "absolute",
                right: 16,
                bottom: 16,
                zIndex: 5000,
            }}
            {...rest}
        >
            <Icon />
        </MuiFab>
    );
}

Fab.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
