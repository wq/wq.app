import React from 'react';
import { Map as LMap } from 'react-leaflet';

export default function Map(props) {
    return <LMap style={{ height: 500 }} {...props} />;
}