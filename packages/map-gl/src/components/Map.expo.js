import React, { useMemo } from 'react';
import { usePlugin } from '@wq/react';
import PropTypes from 'prop-types';
import { View, useWindowDimensions } from 'react-native';
import MapView from 'react-native-maps';

export default function Map({ bounds, children, mapProps, containerStyle }) {
    const { ready } = usePlugin('map'),
        window = useWindowDimensions(),
        region = useMemo(() => {
            const [[xmin, ymin], [xmax, ymax]] = bounds,
                x = (xmax + xmin) / 2,
                y = (ymax + ymin) / 2,
                xdelta = Math.abs(xmax - xmin),
                ydelta = Math.abs(ymax - ymin);
            return {
                latitude: y,
                longitude: x,
                latitudeDelta: ydelta,
                longitudeDelta: xdelta
            };
        }, [bounds]);

    containerStyle = {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 200, // ?
        ...containerStyle
    };

    return (
        <View style={containerStyle}>
            <MapView
                initialRegion={region}
                ref={ready}
                {...window}
                {...mapProps}
            >
                {children}
            </MapView>
        </View>
    );
}

Map.propTypes = {
    bounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object
};
