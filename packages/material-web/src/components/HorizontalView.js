import React from "react";
import { Box } from "@mui/material";
import PropTypes from "prop-types";

export default function HorizontalView({ children, ...rest }) {
    return (
        <Box
            {...rest}
            sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                p: 1,
                ...rest.sx,
            }}
        >
            {children}
        </Box>
    );
}

HorizontalView.propTypes = {
    children: PropTypes.node,
};
