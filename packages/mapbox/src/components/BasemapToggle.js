import React from 'react';
import PropTypes from 'prop-types';

export default function BasemapToggle({ children }) {
    return <>{children}</>;
}

BasemapToggle.propTypes = {
    children: PropTypes.node
};
