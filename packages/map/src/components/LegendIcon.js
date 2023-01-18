import React from "react";
import PropTypes from "prop-types";

export default function LegendIcon({ name, label }) {
    return (
        <img
            src={name}
            alt={label}
            style={{ display: "block", margin: "auto" }}
        />
    );
}

LegendIcon.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
};
