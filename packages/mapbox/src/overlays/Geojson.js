import React from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

export default function Geojson({ url, data }) {
    return (
        <GeoJSONLayer
            data={data || url}
            circlePaint={{
                'circle-color': 'white',
                'circle-radius': 3,
                'circle-stroke-color': '#3086cc',
                'circle-stroke-width': 3
            }}
        />
    );
}

Geojson.propTypes = {
    url: PropTypes.string,
    data: PropTypes.object,
    draw: PropTypes.object
};
