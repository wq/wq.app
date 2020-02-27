import React from 'react';
import PropTypes from 'prop-types';

export default function FormActions({ children }) {
    return <div style={{ display: 'flex' }}>{children}</div>;
}

FormActions.propTypes = {
    children: PropTypes.node
};
