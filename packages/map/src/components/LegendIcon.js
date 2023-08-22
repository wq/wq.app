import React from "react";
import { useComponents } from "@wq/react";
import PropTypes from "prop-types";

export default function LegendIcon({ name, label }) {
    const { Img } = useComponents();
    return <Img src={name} alt={label} />;
}

LegendIcon.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
};
