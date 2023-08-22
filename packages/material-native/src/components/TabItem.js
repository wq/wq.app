import React from "react";
import PropTypes from "prop-types";

export default function TabItem({ value, icon, label, children }) {
    /* eslint no-unused-vars: off */

    // All rendering handled by TabGroup
    return null;
}

TabItem.propTypes = {
    value: PropTypes.string,
    icon: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.node,
};
