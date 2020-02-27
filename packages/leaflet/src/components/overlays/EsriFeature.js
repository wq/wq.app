import React from 'react';
import { MapLayer, useLeaflet } from 'react-leaflet';
import { featureLayer } from 'esri-leaflet';

class FeatureLayer extends MapLayer {
    createLeafletElement(props) {
        return featureLayer({ ...props });
    }
}

export default function EsriFeature(props) {
    const leaflet = useLeaflet();
    return <FeatureLayer leaflet={leaflet} {...props} />;
}
