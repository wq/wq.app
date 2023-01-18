import React from "react";
import PropTypes from "prop-types";

export default function Container({ children }) {
    return <>{children}</>;
}

Container.propTypes = {
    children: PropTypes.node,
};
