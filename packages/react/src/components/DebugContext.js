import React from "react";
import { useRenderContext, useRouteInfo, useComponents } from "../hooks.js";

const SKIP = [
    "app_config",
    "router_info",
    "rt",
    "svc",
    "user",
    "is_authenticated",
    "csrf_token",
    "native",
    "unsynced",
    "local",
    "_refreshCount",
];

export default function DebugContext() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo(),
        { List, ListSubheader, FormatJson } = useComponents();
    const main = { ...context },
        other = {};
    SKIP.forEach((skip) => {
        other[skip] = main[skip];
        delete main[skip];
    });
    return (
        <List>
            <ListSubheader>Context</ListSubheader>
            <FormatJson json={main} />
            <ListSubheader>Route Info</ListSubheader>
            <FormatJson json={routeInfo} />
            <ListSubheader>Additional Context</ListSubheader>
            <FormatJson json={other} />
        </List>
    );
}
