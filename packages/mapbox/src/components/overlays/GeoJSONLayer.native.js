import React, { useMemo } from 'react';
import { Style } from '@react-native-mapbox-gl/maps';
import PropTypes from 'prop-types';

const types = ['symbol', 'line', 'fill', 'circle'];

export default function GeoJSONLayer({ id, before, data, ...rest }) {
    const {
        symbolLayout,
        symbolPaint,
        fillLayout,
        fillPaint,
        lineLayout,
        linePaint,
        circleLayout
    } = rest;
    const style = useMemo(() => {
        return {
            sources: {
                [id]: {
                    type: 'geojson',
                    data
                }
            },
            layers: types.map(type => ({
                id: `${id}-${type}`,
                source: id,
                type,
                paint: rest[`${type}Paint`] || {},
                layout: rest[`${type}Layout`] || {}
            }))
        };
    }, [
        id,
        before,
        data,
        symbolLayout,
        symbolPaint,
        fillLayout,
        fillPaint,
        lineLayout,
        linePaint,
        circleLayout
    ]);

    return <Style json={style} />;
}

GeoJSONLayer.propTypes = {
    id: PropTypes.string,
    before: PropTypes.string,
    data: PropTypes.object
};
