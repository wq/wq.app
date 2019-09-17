import React from 'react';
import { MapLayer, useLeaflet } from 'react-leaflet';
import wms from 'leaflet.wms';

class WMSOverlay extends MapLayer {
    createLeafletElement({ url, ...rest }) {
        return wms.overlay(url, rest);
    }
}

export default function Wms(props) {
    const leaflet = useLeaflet();
    return <WMSOverlay leaflet={leaflet} {...props} />;
}
