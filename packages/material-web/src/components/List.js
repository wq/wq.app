import React from "react";
import { List as MuiList } from "@mui/material";

export default function List(props) {
    return <MuiList sx={{ bgcolor: "background.paper" }} {...props} />;
}
