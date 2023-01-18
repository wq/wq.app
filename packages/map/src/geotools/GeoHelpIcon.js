import React from "react";
import PropTypes from "prop-types";

export default function GeoHelpIcon({ name, type }) {
    const iconClass = getIconClass(name, type);
    if (!iconClass) {
        return `{${name}}`;
    }

    return (
        <span
            className={iconClass}
            style={{
                display: "inline-block",
                width: 18,
                height: 18,
                verticalAlign: "middle",
            }}
        />
    );
}

GeoHelpIcon.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
};

const SHAPES = ["point", "line", "polygon"],
    ICONS = SHAPES.map((shape) => `${shape.toUpperCase()}_ICON`);

function getIconClass(iconName, drawType) {
    let shape = null;

    if (iconName === "TOOL_ICON") {
        if (drawType === "line_string") {
            shape = "line";
        } else if (SHAPES.includes(drawType)) {
            shape = drawType;
        }
    } else if (ICONS.includes(iconName)) {
        shape = SHAPES[ICONS.indexOf(iconName)];
    }

    if (shape) {
        return `mapbox-gl-draw_${shape}`;
    } else {
        return null;
    }
}
