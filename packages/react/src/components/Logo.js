import React from "react";
import { useConfig, useComponents } from "../hooks.js";

export default function Logo({ edge }) {
    const { logo, site_title } = useConfig(),
        { Img } = useComponents();

    if (!logo) {
        return null;
    }
    const style = { height: 64 };
    if (edge === "start") {
        style.marginLeft = -12;
        style.marginRight = 16;
    } else if (edge === "end") {
        style.marginLeft = 16;
        style.marginRight = -12;
    }
    return <Img src={logo} style={style} alt={site_title} />;
}
