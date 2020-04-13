import React from 'react';
import { useIconComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function IconButton({ icon, type = 'button', ...rest }) {
    const { [icon]: Icon } = useIconComponents();
    return (
        <button type={type} {...rest}>
            <Icon />
        </button>
    );
}

IconButton.propTypes = {
    icon: PropTypes.string,
    type: PropTypes.string
};
