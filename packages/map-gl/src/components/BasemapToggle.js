import React from 'react';
import PropTypes from 'prop-types';

export default function BasemapToggle({ active, children }) {
    if (!active) {
        return null;
    }
    return <>{children}</>;
}

BasemapToggle.propTypes = {
    active: PropTypes.bool,
    children: PropTypes.node
};
