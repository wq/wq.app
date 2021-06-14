import React from 'react';
import { useComponents, useMessages } from '@wq/react';
import { TYPE_MAP } from '../hooks';
import PropTypes from 'prop-types';

export default function GeoHelp({ value, type }) {
    const drawType = TYPE_MAP[type] || type,
        { Typography } = useComponents(),
        messageId = `GEO_${drawType.toUpperCase()}_${value ? 'EDIT' : 'NEW'}`,
        { [messageId]: messageTemplate } = useMessages(),
        message = [];

    if (messageTemplate) {
        messageTemplate.split('{').forEach(part => {
            if (message.length === 0) {
                message.push(part);
                return;
            }
            const [iconName, ...rest] = part.split('}'),
                iconClass = getIconClass(iconName, drawType);
            if (iconClass) {
                message.push(
                    <span
                        className={iconClass}
                        style={{
                            display: 'inline-block',
                            width: 18,
                            height: 18,
                            verticalAlign: 'middle'
                        }}
                    />
                );
                message.push(rest.join('}'));
            } else {
                message.push(part);
            }
        });
    }
    return (
        <Typography
            color="textSecondary"
            style={{ flex: 1, textAlign: 'right' }}
        >
            {message}
        </Typography>
    );
}

GeoHelp.toolLabel = false;
GeoHelp.toolDefault = true;

GeoHelp.propTypes = {
    value: PropTypes.object,
    type: PropTypes.string
};

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
