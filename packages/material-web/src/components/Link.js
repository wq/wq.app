import React from "react";
import { Link as RLink } from "@wq/react";
import { Link as MuiLink } from "@mui/material";

export default function Link(props) {
    return <MuiLink component={RLink} {...props} />;
}
