import React from "react";
import PropTypes from "prop-types";

export default function ExpandableListItem({ children, open, onToggle }) {
    const [summary, ...details] = React.Children.toArray(children);
    let handleToggle;
    if (onToggle) {
        handleToggle = (evt) => onToggle(evt.target.open);
    }
    return (
        <details open={open} onToggle={handleToggle}>
            <summary>{summary}</summary>
            {details}
        </details>
    );
}

ExpandableListItem.propTypes = {
    children: PropTypes.node,
    open: PropTypes.bool,
    onToggle: PropTypes.func,
};
