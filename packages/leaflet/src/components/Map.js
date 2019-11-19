import React from 'react';
import PropTypes from 'prop-types';
import { Map as LMap } from 'react-leaflet';

export default function Map({ bounds, children, ...props }) {
    return (
        <LMap
            bounds={bounds}
            style={{ flexGrow: 1, minHeight: 200 }}
            {...props}
        >
            {children}
        </LMap>
    );
}

Map.propTypes = {
    bounds: PropTypes.array,
    conf: PropTypes.object,
    children: PropTypes.node
};
