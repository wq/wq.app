import React from 'react';
import PropTypes from 'prop-types';
import { ZoomControl, ScaleControl, RotationControl } from 'react-mapbox-gl';

export default function Legend({ children }) {
    return (
        <>
            <ZoomControl position="top-left" />
            <RotationControl position="top-left" style={{ marginTop: '1em' }} />
            <ScaleControl />
            {children}
        </>
    );
}

Legend.propTypes = {
    children: PropTypes.node
};
