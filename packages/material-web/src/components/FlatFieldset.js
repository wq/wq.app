import React from "react";
import { Typography } from "@mui/material";
import PropTypes from "prop-types";

export default function FlatFieldset({ label, children }) {
    return (
        <>
            <Typography color="textSecondary">{label}</Typography>
            {children}
        </>
    );
}

FlatFieldset.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
};
