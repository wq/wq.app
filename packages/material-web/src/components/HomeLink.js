import React from "react";
import { Link } from "@wq/react";
import Button from "@mui/material/Button";
import HomeIcon from "@mui/icons-material/Home";
import PropTypes from "prop-types";

export default function HomeLink({ to, label, active, ...rest }) {
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
