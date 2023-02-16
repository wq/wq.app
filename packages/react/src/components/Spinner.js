import React from "react";
import { useSpinner } from "../hooks.js";

const style = {
    position: "absolute",
    top: "1em",
    right: "1em",
    color: "gray",
};

export default function Spinner() {
    const { active } = useSpinner();
    if (!active) {
        return null;
    }
    // FIXME: text, type
    return <div style={style}>(Working...)</div>;
}
