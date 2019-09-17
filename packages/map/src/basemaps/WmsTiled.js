import React from 'react';
import { WMSTileLayer } from 'react-leaflet';

export default function WmsTiled(props) {
    return <WMSTileLayer {...props} />;
}
