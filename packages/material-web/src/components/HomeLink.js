import React from "react";
import { Link, useIcon } from "@wq/react";
import { Button } from "@mui/material";
import PropTypes from "prop-types";

export default function HomeLink({ to, label, active, ...rest }) {
    const HomeIcon = useIcon("home") || (() => "Home");
    return (
        <Button
            component={Link}
            to={to}
            color={active ? "inherit" : "primary"}
            aria-label={label}
            {...rest}
        >
            <HomeIcon sx={{ verticalAlign: "middle" }} />
        </Button>
    );
}

HomeLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    label: PropTypes.string,
    active: PropTypes.bool,
};
