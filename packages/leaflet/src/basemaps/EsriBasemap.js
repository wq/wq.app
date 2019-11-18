import React from 'react';
import PropTypes from 'prop-types';
import { LayerGroup, MapLayer, useLeaflet } from 'react-leaflet';
import { basemapLayer } from 'esri-leaflet';

class BasemapLayer extends MapLayer {
    createLeafletElement({ layer, ...rest }) {
        return basemapLayer(layer, rest);
    }
}

export default function EsriBasemap({ layer, labels, ...rest }) {
    const leaflet = useLeaflet(),
        props = {
            ...rest,
            layer,
            leaflet
        };
    if (labels) {
        const labelProps = {
            ...props,
            layer: props.layer + 'Labels'
        };
        return (
            <LayerGroup>
                <BasemapLayer {...props} />
                <BasemapLayer {...labelProps} />
            </LayerGroup>
        );
    } else {
        return <BasemapLayer {...props} />;
    }
}
EsriBasemap.propTypes = {
    layer: PropTypes.string.isRequired,
    labels: PropTypes.bool
};
