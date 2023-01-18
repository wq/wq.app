import React from "react";
import MuiList from "@mui/material/List";

export default function List(props) {
    return <MuiList sx={{ bgcolor: "background.paper" }} {...props} />;
}
