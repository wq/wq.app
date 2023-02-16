import React from "react";
import * as ReduxFirstRouterLink from "redux-first-router-link";

const { NavLink } = ReduxFirstRouterLink;

export default function Link(props) {
    return <NavLink {...props} />;
}
