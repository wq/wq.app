import React from "react";
import PropTypes from "prop-types";

export default function ScrollView({ children, style }) {
    return (
        <div
            style={{
                overflowX: "hidden",
                overflowY: "auto",
                flex: 1,
                ...style,
            }}
        >
            {children}
        </div>
    );
}

ScrollView.propTypes = {
    children: PropTypes.node,
    style: PropTypes.object,
};
