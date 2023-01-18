import React from "react";
import PropTypes from "prop-types";

export default function SidePanel({ children }) {
    return <>{children}</>;
}

SidePanel.propTypes = {
    children: PropTypes.node,
};
