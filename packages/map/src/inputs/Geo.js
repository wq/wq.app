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
    inset = true,
    children
}) {
    const {
            Fieldset: DefaultFieldset,
            FlatFieldset,
            AutoMap,
            GeoTools
        } = useComponents(),
        { HelperText } = useInputComponents(),
        { Draw, Accuracy } = useOverlayComponents(),
        [, { value }, { setValue }] = useField(name),
        [, { value: accuracy }, { setValue: setAccuracy }] = useField(
            `${name}_accuracy`
        ),
        maxGeometries = 1; // FIXME;

    const geojson = useFeatureCollection(value),
        drawType = TYPE_MAP[type] || 'all',
        Fieldset = inset ? DefaultFieldset : FlatFieldset;

    function handleChange(geojson) {
        setValue(asGeometry(geojson, maxGeometries));
        if (accuracy) {
            setAccuracy(null);
        }
    }

    return (
        <Fieldset label={label}>
            <GeoTools name={name} type={type} />
            <AutoMap
                name={name}
                containerStyle={{ minHeight: 400 }}
                context={emptyContext}
            >
                {children}
                <Accuracy accuracy={accuracy} data={geojson} />
                <Draw
                    name={name}
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
    inset: PropTypes.boolean,
    children: PropTypes.node
};

const emptyContext = {};
