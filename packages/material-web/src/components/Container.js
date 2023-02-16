import React from "react";
import { Box } from "@mui/material";
import PropTypes from "prop-types";

export default function Container({ children }) {
    return (
        <Box
            sx={{
                display: "flex",
                flexDirection: "column",
                height: "100vh",
            }}
        >
            {children}
        </Box>
    );
}
Container.propTypes = {
    children: PropTypes.node,
};
