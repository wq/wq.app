import React from 'react';
import { MapLayer, useLeaflet } from 'react-leaflet';
import { dynamicMapLayer } from 'esri-leaflet';

class DynamicMapLayer extends MapLayer {
    createLeafletElement(props) {
        return dynamicMapLayer({ ...props });
    }
}

export default function EsriDynamic(props) {
    const leaflet = useLeaflet();
    return <DynamicMapLayer leaflet={leaflet} {...props} />;
}
