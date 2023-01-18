import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Source, Layer } from "react-map-gl";

export default function Tile({ name, active, url, tileSize, layout, paint }) {
    const source = useMemo(() => {
        return {
            type: "raster",
            tiles: [url],
            tileSize: tileSize || 256,
        };
    }, [url]);

    if (active === false) {
        layout = { ...(layout || {}), visibility: "none" };
    }

    return (
        <Source id={name} {...source}>
            <Layer id={name} type="raster" layout={layout} paint={paint} />
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
