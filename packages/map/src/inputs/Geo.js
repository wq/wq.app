import React from "react";
import { useComponents, useInputComponents } from "@wq/react";
import {
    TYPE_MAP,
    useOverlayComponents,
    useFeatureCollection,
    asGeometry,
} from "../hooks.js";
import { useField } from "formik";
import PropTypes from "prop-types";

export default function Geo({
    name,
    type,
    mapId = undefined,
    required,
    label,
    hint,
    inset = true,
    children,
}) {
    const { MapProvider, AutoMap, GeoTools } = useComponents(),
        {
            Fieldset: DefaultFieldset,
            FlatFieldset,
            HelperText,
        } = useInputComponents(),
        { Draw, Accuracy } = useOverlayComponents(),
        [, { value }, { setValue }] = useField(name),
        [, { value: accuracy }, { setValue: setAccuracy }] = useField(
            `${name}_accuracy`
        ),
        maxGeometries = 1; // FIXME;

    const geojson = useFeatureCollection(value),
        drawType = TYPE_MAP[type] || "all",
        Fieldset = inset ? DefaultFieldset : FlatFieldset;

    function handleChange(geojson) {
        setValue(asGeometry(geojson, maxGeometries));
        if (accuracy) {
            setAccuracy(null);
        }
    }

    return (
        <MapProvider>
            <Fieldset label={label}>
                <GeoTools name={name} type={type} mapId={mapId} />
                <AutoMap
                    name={name}
                    mapId={mapId}
                    containerStyle={{ minHeight: 400 }}
                    context={emptyContext}
                    toolbarAnchor="bottom-right"
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
        </MapProvider>
    );
}

Geo.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    mapId: PropTypes.string,
    required: PropTypes.bool,
    label: PropTypes.string,
    hint: PropTypes.string,
    inset: PropTypes.bool,
    children: PropTypes.node,
};

const emptyContext = {};
