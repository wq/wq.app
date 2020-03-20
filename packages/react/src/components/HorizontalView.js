import React from 'react';
import PropTypes from 'prop-types';

export default function HorizontalView({ children }) {
    return <div style={{ display: 'flex' }}>{children}</div>;
}

HorizontalView.propTypes = {
    children: PropTypes.node
};
