import React from 'react';
import { ZoomControl, ScaleControl, RotationControl } from 'react-mapbox-gl';

export default function MapInteraction() {
    return (
        <>
            <ZoomControl position="top-left" />
            <RotationControl position="top-left" style={{ marginTop: '1em' }} />
            <ScaleControl />
        </>
    );
}
