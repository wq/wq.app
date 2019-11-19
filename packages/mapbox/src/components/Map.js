import React from 'react';
import PropTypes from 'prop-types';
import ReactMapboxGl from 'react-mapbox-gl';
import { useMapState } from '@wq/map';

const Root = ReactMapboxGl({});

export default function Map({ bounds, children, ...props }) {
    const [[ymin, xmin], [ymax, xmax]] = bounds,
        state = useMapState(),
        basemap = state && state.basemaps.filter(basemap => basemap.active)[0];
    let style;
    if (basemap && basemap.type === 'vector-tile') {
        style = basemap.url;
    } else {
        style = null;
    }
    return (
        <Root
            style={style}
            fitBounds={[[xmin, ymin], [xmax, ymax]]}
            containerStyle={{ flexGrow: 1, minHeight: 200 }}
            {...props}
        >
            {children}
        </Root>
    );
}

Map.propTypes = {
    bounds: PropTypes.array,
    conf: PropTypes.object,
    children: PropTypes.node
};
