import React from 'react';
import { useComponents, useInputComponents } from '@wq/react';
import {
    TYPE_MAP,
    useOverlayComponents,
    useFeatureCollection,
    asGeometry
} from '../hooks';
import { useField } from 'formik';
import PropTypes from 'prop-types';

export default function Geo({
    name,
    type,
    required,
    label,
    hint,
    inset = true
}) {
    const {
            Fieldset: DefaultFieldset,
            FlatFieldset,
            AutoMap,
            GeoTools
        } = useComponents(),
        { HelperText } = useInputComponents(),
        { Draw } = useOverlayComponents(),
        [, { value }, { setValue }] = useField(name),
        maxGeometries = 1; // FIXME;

    const geojson = useFeatureCollection(value),
        drawType = TYPE_MAP[type] || 'all',
        Fieldset = inset ? DefaultFieldset : FlatFieldset;

    function handleChange(geojson) {
        setValue(asGeometry(geojson, maxGeometries));
    }

    return (
        <Fieldset label={label}>
            <GeoTools name={name} type={type} />
            <AutoMap name={name} containerStyle={{ minHeight: 400 }}>
                <Draw
                    type={drawType}
                    required={required}
                    data={geojson}
                    setData={handleChange}
                />
            </AutoMap>
            <HelperText name={name} hint={hint} />
        </Fieldset>
    );
}

Geo.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    required: PropTypes.boolean,
    label: PropTypes.string,
    hint: PropTypes.string,
    inset: PropTypes.boolean
};
