import React from "react";
import PropTypes from "prop-types";

export default function Fieldset({ label, children }) {
    return (
        <fieldset>
            <legend>{label}</legend>
            {children}
        </fieldset>
    );
}

Fieldset.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
};
