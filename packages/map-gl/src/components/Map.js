import React, { useMemo, useCallback } from 'react';
import { usePlugin } from '@wq/react';
import PropTypes from 'prop-types';
import ReactMapboxGl from 'react-mapbox-gl';
import { findBasemapStyle } from '../util';

export default function Map({
    name,
    initBounds,
    children,
    mapProps,
    containerStyle
}) {
    const { ready } = usePlugin('map'),
        Root = useMemo(() => ReactMapboxGl(mapProps || {}), [mapProps]),
        fitBounds = useMemo(() => {
            const [[xmin, ymin], [xmax, ymax]] = initBounds;
            return [
                [xmin, ymin],
                [xmax, ymax]
            ];
        }, [initBounds]),
        onStyleLoad = useCallback(instance => ready(instance, name), [
            ready,
            name
        ]),
        style = findBasemapStyle(children);

    containerStyle = {
        flex: '1',
        minHeight: 200,
        ...containerStyle
    };

    return (
        <Root
            style={style}
            fitBounds={fitBounds}
            onStyleLoad={onStyleLoad}
            containerStyle={containerStyle}
        >
            {children}
        </Root>
    );
}

Map.propTypes = {
    name: PropTypes.string,
    initBounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object
};
