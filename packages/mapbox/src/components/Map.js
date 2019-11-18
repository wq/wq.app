import React from 'react';
import PropTypes from 'prop-types';
import ReactMapboxGl from 'react-mapbox-gl';

const Root = ReactMapboxGl({});

export default function Map({ bounds, conf, children, ...props }) {
    const [[ymin, xmin], [ymax, xmax]] = bounds,
        basemap = conf.basemaps && conf.basemaps[0];
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
