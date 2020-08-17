import React, { useMemo } from 'react';
import { useComponents } from '@wq/react';
import { useOverlayComponents } from '../../hooks';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export const TYPE_MAP = {
    geopoint: 'point',
    geotrace: 'line_string',
    geoshape: 'polygon'
};
export default function Geo({ name, type, label }) {
    const { Fieldset, AutoMap } = useComponents(),
        { Draw } = useOverlayComponents(),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue } = helpers;

    const drawType = TYPE_MAP[type] || 'all',
        geojson = useFeatureCollection(value);

    function handleChange(geojson) {
        setValue(flatten(geojson));
    }

    return (
        <Fieldset label={label}>
            <AutoMap>
                <Draw type={drawType} data={geojson} setData={handleChange} />
            </AutoMap>
        </Fieldset>
    );
}

Geo.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string
};

export function flatten(geojson) {
    var geoms = [];
    if (geojson.type === 'FeatureCollection') {
        geojson.features.forEach(function (feature) {
            addGeometry(feature.geometry);
        });
    } else if (geojson.type === 'Feature') {
        addGeometry(geojson.geometry);
    } else {
        addGeometry(geojson);
    }

    if (geoms.length == 1) {
        return geoms[0];
    } else {
        return {
            type: 'GeometryCollection',
            geometries: geoms
        };
    }
    function addGeometry(geometry) {
        if (geometry.type == 'GeometryCollection') {
            geometry.geometries.forEach(addGeometry);
        } else {
            geoms.push(geometry);
        }
    }
}

export function useFeatureCollection(value) {
    return useMemo(() => {
        return asFeatureCollection(value);
    }, [value]);
}

function asFeatureCollection(geojson) {
    if (!geojson || !geojson.type) {
        return geojson;
    }
    const geometry = flatten(geojson);

    let features;
    if (geometry.type === 'GeometryCollection') {
        features = geometry.geometries.map(geometry => ({
            type: 'Feature',
            properties: {},
            geometry
        }));
    } else {
        features = [
            {
                type: 'Feature',
                properties: {},
                geometry
            }
        ];
    }

    return {
        type: 'FeatureCollection',
        features
    };
}
