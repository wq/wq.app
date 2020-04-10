import React from 'react';
import { useIconComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function ListItem({ children, description, icon, ...rest }) {
    const icons = useIconComponents(),
        Icon = icon ? icons[icon] : null;
    return (
        <li {...rest}>
            {Icon && <Icon />}
            {children}
            {description && <small>{description}</small>}
        </li>
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string
};
