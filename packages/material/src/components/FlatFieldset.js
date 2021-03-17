import React from 'react';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';

export default function FlatFieldset({ label, children }) {
    return (
        <>
            <Typography color="textSecondary">{label}</Typography>
            {children}
        </>
    );
}

FlatFieldset.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node
};
