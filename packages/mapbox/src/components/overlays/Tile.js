import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { Source, Layer } from 'react-mapbox-gl';

export default function Tile({ name, active, url, layout, paint }) {
    const source = useMemo(() => {
        return {
            type: 'raster',
            tiles: [url]
        };
    }, [url]);

    if (active === false) {
        layout = { ...(layout || {}), visibility: 'none' };
    }

    return (
        <>
            <Source id={name} tileJsonSource={source} />
            <Layer
                id={name}
                type="raster"
                sourceId={name}
                layout={layout}
                paint={paint}
            />
        </>
    );
}

Tile.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    url: PropTypes.string,
    layout: PropTypes.object,
    paint: PropTypes.object
};
