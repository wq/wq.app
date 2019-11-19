import React from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

export default function Highlight({ data }) {
    return (
        <GeoJSONLayer
            data={data}
            linePaint={{
                'line-width': 5,
                'line-color': '#0ff',
                'line-opacity': 1
            }}
        />
    );
}

Highlight.propTypes = {
    data: PropTypes.object
};
