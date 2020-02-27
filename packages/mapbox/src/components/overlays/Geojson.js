import React from 'react';
import PropTypes from 'prop-types';
import { GeoJSONLayer } from 'react-mapbox-gl';

export default function Geojson({
    name,
    active,
    before,
    url,
    data,
    icon,
    symbol,
    color,
    fill,
    line,
    circle
}) {
    let symbolLayout,
        symbolPaint,
        fillLayout,
        fillPaint,
        lineLayout,
        linePaint,
        circleLayout,
        circlePaint;
    if (symbol) {
        const { paint, ...layout } = symbol;
        symbolLayout = layout;
        symbolPaint = paint;
    } else if (icon) {
        symbolLayout = {
            'icon-image': icon,
            'icon-allow-overlap': true
        };
    } else if (fill || line || circle) {
        fillPaint = fill;
        linePaint = line;
        circlePaint = circle;
    } else {
        fillPaint = {
            'fill-color': color || '#3388ff',
            'fill-opacity': [
                'match',
                ['geometry-type'],
                ['Polygon', 'MultiPolygon'],
                0.2,
                0
            ]
        };
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

    const hidden = { visibility: 'none' };
    if (active !== false) {
        fillLayout = fillPaint ? {} : hidden;
        lineLayout = linePaint ? {} : hidden;
        circleLayout = circlePaint ? {} : hidden;
    } else {
        if (symbolLayout) {
            symbolLayout = { ...symbolLayout, ...hidden };
        }
        fillLayout = lineLayout = circleLayout = hidden;
    }

    return (
        <GeoJSONLayer
            id={name}
            before={before}
            data={data || url}
            symbolLayout={symbolLayout}
            symbolPaint={symbolPaint}
            fillLayout={fillLayout}
            fillPaint={fillPaint}
            lineLayout={lineLayout}
            linePaint={linePaint}
            circleLayout={circleLayout}
            circlePaint={circlePaint}
        />
    );
}

Geojson.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    before: PropTypes.string,
    url: PropTypes.string,
    data: PropTypes.object,
    icon: PropTypes.string,
    symbol: PropTypes.object,
    color: PropTypes.string,
    fill: PropTypes.object,
    line: PropTypes.object,
    circle: PropTypes.object,
    draw: PropTypes.object
};
