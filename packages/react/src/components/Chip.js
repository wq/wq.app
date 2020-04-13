import React from 'react';
import { useComponents, useIconComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function Chip({ label, icon, onDelete, ...rest }) {
    const { IconButton } = useComponents(),
        icons = useIconComponents(),
        Icon = icon ? icons[icon] : null;
    return (
        <span
            style={{
                border: '1px solid blue',
                'border-radius': '1em',
                padding: '0.25em'
            }}
            {...rest}
        >
            {Icon && <Icon />}
            {label}
            {onDelete && <IconButton icon="delete" onClick={onDelete} />}
        </span>
    );
}

Chip.propTypes = {
    label: PropTypes.node,
    icon: PropTypes.string,
    onDelete: PropTypes.func
};
