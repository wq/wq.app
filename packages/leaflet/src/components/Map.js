import React, { useEffect, useMemo } from 'react';
import { usePlugin } from '@wq/react';
import PropTypes from 'prop-types';
import { Map as LMap, useLeaflet } from 'react-leaflet';

function Ready({ name }) {
    const { ready } = usePlugin('map') || {},
        { map } = useLeaflet();
    useEffect(() => {
        ready && map && ready(map, name);
    }, [ready, map]);
    return null;
}

export default function Map({
    name,
    initBounds,
    children,
    mapProps,
    containerStyle
}) {
    const fitBounds = useMemo(() => {
        if (!initBounds) {
            return initBounds;
        }
        const [[xmin, ymin], [xmax, ymax]] = initBounds;
        return [
            [ymin, xmin],
            [ymax, xmax]
        ];
    }, [initBounds]);
    const style = {
        flex: '1',
        minHeight: 200,
        ...containerStyle
    };
    const maxZoom = (mapProps && mapProps.maxZoom) || 18;
    return (
        <LMap bounds={fitBounds} style={style} maxZoom={maxZoom} {...mapProps}>
            <Ready name={name} />
            {children}
        </LMap>
    );
}

Map.propTypes = {
    name: PropTypes.string,
    initBounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object
};
