import React from 'react';
import PropTypes from 'prop-types';

export default function OverlayToggle({ active, children }) {
    if (!active) {
        return null;
    }
    return <>{children}</>;
}

OverlayToggle.propTypes = {
    active: PropTypes.bool,
    children: PropTypes.node
};
