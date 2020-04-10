import React from 'react';
import { useComponents, useIconComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function Fab({ icon, to }) {
    const { Link } = useComponents(),
        { [icon]: Icon } = useIconComponents();
    return (
        <Link to={to}>
            <Icon />
        </Link>
    );
}

Fab.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
