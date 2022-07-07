import React from 'react';

export default function MapContainer({ children }) {
    const [mapTools, map] = React.children(children).toArray();
    return React.cloneElement(map, {}, [mapTools, ...map.props.children]);
}
