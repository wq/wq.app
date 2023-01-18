import React from "react";
import PropTypes from "prop-types";

export default function HorizontalView({ children, style, ...rest }) {
    return (
        <div
            style={{
                display: "flex",
                justifyContent: "space-between",
                ...style,
            }}
            {...rest}
        >
            {children}
        </div>
    );
}

HorizontalView.propTypes = {
    children: PropTypes.node,
    style: PropTypes.object,
};
