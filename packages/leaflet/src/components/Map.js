import React, { useEffect, useMemo } from 'react';
import { usePlugin } from '@wq/react';
import PropTypes from 'prop-types';
import { Map as LMap, useLeaflet } from 'react-leaflet';

function Ready() {
    const { ready } = usePlugin('map') || {},
        { map } = useLeaflet();
    useEffect(() => {
        ready && map && ready(map);
    }, [ready, map]);
    return null;
}

export default function Map({ bounds, children, mapProps, containerStyle }) {
    const fitBounds = useMemo(() => {
        if (!bounds) {
            return bounds;
        }
        const [[xmin, ymin], [xmax, ymax]] = bounds;
        return [
            [ymin, xmin],
            [ymax, xmax]
        ];
    }, [bounds]);
    const style = {
        flex: '1',
        minHeight: 200,
        ...containerStyle
    };
    const maxZoom = (mapProps && mapProps.maxZoom) || 18;
    return (
        <LMap bounds={fitBounds} style={style} maxZoom={maxZoom} {...mapProps}>
            <Ready />
            {children}
        </LMap>
    );
}

Map.propTypes = {
    bounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object
};
