import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Source, Layer } from "react-map-gl";

export default function Tile({
    name,
    active,
    url,
    tileSize,
    layout = {},
    paint = {},
}) {
    const source = useMemo(() => {
        return {
            id: name,
            type: "raster",
            tiles: [url],
            tileSize: tileSize || 256,
        };
    }, [name, url]);

    const layer = useMemo(() => {
        return {
            id: name,
            type: "raster",
            layout:
                active === false
                    ? { ...(layout || {}), visibility: "none" }
                    : layout,
            paint,
        };
    }, [name, active, layout, paint]);

    return (
        <Source {...source}>
            <Layer {...layer} />
        </Source>
    );
}

Tile.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    url: PropTypes.string,
    tileSize: PropTypes.number,
    layout: PropTypes.object,
    paint: PropTypes.object,
};
