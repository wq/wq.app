import React from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

export default function Geojson({ name, url, data, icon }) {
    let circlePaint, symbolLayout;
    if (icon) {
        symbolLayout = {
            'icon-image': icon
        };
    } else {
        circlePaint = {
            'circle-color': 'white',
            'circle-radius': 3,
            'circle-stroke-color': '#3086cc',
            'circle-stroke-width': 3
        };
    }
    return (
        <GeoJSONLayer
            id={name}
            data={data || url}
            circlePaint={circlePaint}
            symbolLayout={symbolLayout}
        />
    );
}

Geojson.propTypes = {
    name: PropTypes.string,
    url: PropTypes.string,
    data: PropTypes.object,
    icon: PropTypes.string,
    draw: PropTypes.object
};
