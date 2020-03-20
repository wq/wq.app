import React from 'react';
import { useComponents } from '../hooks';
import PropTypes from 'prop-types';

export default function Fab({ type, to }) {
    const { Link } = useComponents();
    return <Link to={to}>{type}</Link>;
}

Fab.propTypes = {
    type: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
