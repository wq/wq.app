import React, { useMemo } from 'react';
import { usePlugin } from '@wq/react';
import PropTypes from 'prop-types';
import ReactMapboxGl from 'react-mapbox-gl';
import { findBasemapStyle } from '../util';

export default function Map({ bounds, children, mapProps, containerStyle }) {
    const { ready } = usePlugin('map'),
        Root = useMemo(() => ReactMapboxGl(mapProps || {}), [mapProps]),
        fitBounds = useMemo(() => {
            const [[ymin, xmin], [ymax, xmax]] = bounds;
            return [
                [xmin, ymin],
                [xmax, ymax]
            ];
        }, [bounds]),
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
            onStyleLoad={ready}
            containerStyle={containerStyle}
        >
            {children}
        </Root>
    );
}

Map.propTypes = {
    bounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object
};
