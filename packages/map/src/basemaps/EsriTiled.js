import React from 'react';
import { MapLayer, useLeaflet } from 'react-leaflet';
import { tiledMapLayer } from 'esri-leaflet';

class TiledMapLayer extends MapLayer {
    createLeafletElement(props) {
        return tiledMapLayer({ ...props });
    }
}

export default function EsriTiled(props) {
    const leaflet = useLeaflet();
    return <TiledMapLayer leaflet={leaflet} {...props} />;
}
