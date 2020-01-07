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
    let symbolLayout, symbolPaint, fillPaint, linePaint, circlePaint;
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

    if (active !== false) {
        // Render layer (default if active is undefined)
        return (
            <GeoJSONLayer
                id={name}
                before={before}
                data={data || url}
                symbolLayout={symbolLayout}
                symbolPaint={symbolPaint}
                fillPaint={fillPaint}
                linePaint={linePaint}
                circlePaint={circlePaint}
            />
        );
    } else {
        // Unstyled placeholder to preserve layer order
        return (
            <GeoJSONLayer
                id={name}
                before={before}
                data={null}
                symbolLayout={symbolLayout && {}}
                symbolPaint={symbolPaint && {}}
                fillPaint={
                    fillPaint && {
                        'fill-opacity': 0,
                        'fill-color': 'white'
                    }
                }
                linePaint={
                    linePaint && {
                        'line-opacity': 0,
                        'line-color': 'white'
                    }
                }
                circlePaint={
                    circlePaint && {
                        'circle-opacity': 0,
                        'circle-color': 'white',
                        'circle-radius': 0
                    }
                }
            />
        );
    }
}

Geojson.propTypes = {
    name: PropTypes.string,
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
