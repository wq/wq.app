import React from 'react';
import { useComponents, useIcon } from '../hooks';
import PropTypes from 'prop-types';

export default function Fab({ icon, to, ...rest }) {
    const { Link } = useComponents(),
        Icon = useIcon(icon);
    return (
        <Link to={to} {...rest}>
            <Icon />
        </Link>
    );
}

Fab.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
