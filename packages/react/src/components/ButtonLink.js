import React from "react";
import * as ReduxFirstRouterLink from "redux-first-router-link";

const { NavLink } = ReduxFirstRouterLink;

export default function ButtonLink(props) {
    return (
        <NavLink
            style={{
                textDecoration: "none",
                border: "1px solid #eee",
                borderRadius: "0.2em",
                padding: "0.2em",
            }}
            {...props}
        />
    );
}
