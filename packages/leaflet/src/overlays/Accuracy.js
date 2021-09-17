import React from 'react';
import { Circle } from 'react-leaflet';
import PropTypes from 'prop-types';

export default function Accuracy({ accuracy, data }) {
    const geometry =
        data && data.features && data.features[0] && data.features[0].geometry;
    if (!accuracy || !geometry || geometry.type !== 'Point') {
        return null;
    }
    const [lng, lat] = geometry.coordinates;
    return <Circle center={[lat, lng]} radius={accuracy} />;
}

Accuracy.propTypes = {
    accuracy: PropTypes.number,
    data: PropTypes.object
};
