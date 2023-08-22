import React from "react";
import PropTypes from "prop-types";
import Icon from "react-native-paper/src/components/Icon";

export default function GeoHelpIcon({ name, type }) {
    const iconClass = getIconClass(name, type);
    if (!iconClass) {
        return `{${name}}`;
    }

    return <Icon source={iconClass} />;
}

GeoHelpIcon.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
};

const SHAPES = ["point", "line", "polygon"],
    NAMES = SHAPES.map((shape) => `${shape.toUpperCase()}_ICON`),
    ICONS = {
        point: "map-marker",
        line: "vector-polyline",
        polygon: "vector-polygon",
    };

function getIconClass(iconName, drawType) {
    let shape = null;

    if (iconName === "TOOL_ICON") {
        if (drawType === "line_string") {
            shape = "line";
        } else if (SHAPES.includes(drawType)) {
            shape = drawType;
        }
    } else if (NAMES.includes(iconName)) {
        shape = SHAPES[NAMES.indexOf(iconName)];
    }

    if (shape) {
        return ICONS[shape];
    } else {
        return null;
    }
}
