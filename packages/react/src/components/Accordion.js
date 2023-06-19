import React from "react";
import PropTypes from "prop-types";

export default function ExpansionPanel({ summary, children, open, onToggle }) {
    let handleToggle;
    if (onToggle) {
        handleToggle = (evt) => onToggle(evt.target.open);
    }
    return (
        <details open={open} onToggle={handleToggle}>
            <summary>{summary}</summary>
            {children}
        </details>
    );
}

ExpansionPanel.propTypes = {
    summary: PropTypes.node,
    children: PropTypes.node,
    open: PropTypes.bool,
    onToggle: PropTypes.func,
};
