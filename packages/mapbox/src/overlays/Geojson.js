import React from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

export default function Geojson({
    name,
    url,
    data,
    icon,
    symbol,
    color,
    line,
    circle
}) {
    let circlePaint, linePaint, symbolLayout;
    if (symbol) {
        symbolLayout = symbol;
    } else if (icon) {
        symbolLayout = {
            'icon-image': icon,
            'icon-allow-overlap': true
        };
    } else if (line) {
        linePaint = line;
    } else if (circle) {
        circlePaint = circle;
    } else {
        linePaint = {
            'line-width': 3,
            'line-color': color || '#3388ff',
            'line-opacity': 1
        };
        circlePaint = {
            'circle-color': 'white',
            'circle-radius': [
                'match',
                ['geometry-type'],
                ['Point', 'MultiPoint'],
                3,
                0
            ],
            'circle-stroke-color': color || '#3086cc',
            'circle-stroke-width': [
                'match',
                ['geometry-type'],
                ['Point', 'MultiPoint'],
                3,
                0
            ],
            'circle-opacity': [
                'match',
                ['geometry-type'],
                ['Point', 'MultiPoint'],
                1,
                0
            ]
        };
    }
    return (
        <GeoJSONLayer
            id={name}
            data={data || url}
            circlePaint={circlePaint}
            linePaint={linePaint}
            symbolLayout={symbolLayout}
        />
    );
}

Geojson.propTypes = {
    name: PropTypes.string,
    url: PropTypes.string,
    data: PropTypes.object,
    icon: PropTypes.string,
    symbol: PropTypes.object,
    color: PropTypes.string,
    line: PropTypes.object,
    circle: PropTypes.object,
    draw: PropTypes.object
};
