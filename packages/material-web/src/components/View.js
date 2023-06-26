import React from "react";
import { Box } from "@mui/material";

export default function View(props) {
    return <Box {...props} sx={{ position: "relative", ...props.sx }} />;
}
