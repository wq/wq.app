import React from 'react';
import PropTypes from 'prop-types';

export default function ScrollView({ children }) {
    return (
        <div style={{ overflowX: 'hidden', overflowY: 'auto', flex: 1 }}>
            {children}
        </div>
    );
}

ScrollView.propTypes = {
    children: PropTypes.node
};
