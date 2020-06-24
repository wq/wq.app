import React from 'react';
import PropTypes from 'prop-types';
import { Marker as RNMarker, Polyline as RNPolyline } from 'react-native-maps';
import { Colors } from 'react-native-paper';
import { useGeoJSON } from '@wq/map';

const COLOR_LIST = Object.values(Colors);

export default function GeoJSONLayer({ id, data }) {
    data = useGeoJSON(data);
    const features = (data && data.features) || [];
    return (
        <>
            {features.map(feature => (
                <Feature
                    key={feature.id}
                    feature={{
                        ...feature,
                        layer: { source: id }
                    }}
                />
            ))}
        </>
    );
}

function makePoint([longitude, latitude]) {
    return { latitude, longitude };
}

function makeLine(line) {
    return line.map(makePoint);
}

function Feature({ feature }) {
    if (feature.geometry.type === 'Point') {
        return (
            <RNMarker
                pinColor={getColor(feature)}
                coordinate={makePoint(feature.geometry.coordinates)}
            />
        );
    } else if (feature.geometry.type === 'MultiLineString') {
        return (
            <RNPolyline
                strokeColor={getColor(feature)}
                strokeWidth={8}
                coordinates={makeLine(feature.geometry.coordinates[0])}
            />
        );
    } else if (feature.geometry.type === 'Polygon') {
        return (
            <RNPolyline
                strokeColor={getColor(feature)}
                fillColor={getColor(feature)}
                strokeWidth={8}
                coordinates={makeLine(feature.geometry.coordinates[0])}
            />
        );
    } else {
        return null;
    }
}
GeoJSONLayer.propTypes = {
    id: PropTypes.string,
    data: PropTypes.object
};

const colors = {};
function getColor(feature) {
    const layerName = feature.layer.source;
    if (!colors[layerName]) {
        colors[layerName] =
            COLOR_LIST[Math.round(COLOR_LIST.length * Math.random())];
    }
    return colors[layerName];
}
