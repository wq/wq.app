import React from "react";
import PropTypes from "prop-types";

export default function Popup({ open, children }) {
    return (
        <div
            style={{
                display: open ? "block" : "none",
                position: "fixed",
                border: "1px solid black",
                backgroundColor: "white",
                zIndex: 100,
                margin: "1em",
                padding: "1em",
                bottom: 0,
                left: "10%",
                right: "10%",
                maxHeight: "50%",
            }}
        >
            {children}
        </div>
    );
}

Popup.propTypes = {
    open: PropTypes.bool,
    children: PropTypes.node,
};
