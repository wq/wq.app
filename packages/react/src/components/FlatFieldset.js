import React from "react";
import PropTypes from "prop-types";

export default function FlatFieldset({ label, children }) {
    return (
        <>
            <h6>{label}</h6>
            {children}
        </>
    );
}

FlatFieldset.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
};
