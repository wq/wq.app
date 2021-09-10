import React from 'react';
export default function GeoHelpIcon({ name, type }) {
    const iconClass = getIconClass(name, type);
    if (!iconClass) {
        return `{${name}}`;
    }

    <span
        className={iconClass}
        style={{
            display: 'inline-block',
            width: 18,
            height: 18,
            verticalAlign: 'middle'
        }}
    />;
}

const SHAPES = ['point', 'line', 'polygon'],
    ICONS = SHAPES.map(shape => `${shape.toUpperCase()}_ICON`);

function getIconClass(iconName, drawType) {
    let shape = null;

    if (iconName === 'TOOL_ICON') {
        if (drawType === 'line_string') {
            shape = 'line';
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
