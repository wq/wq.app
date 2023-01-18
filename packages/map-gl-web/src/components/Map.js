import React from "react";
import { usePlugin } from "@wq/react";
import PropTypes from "prop-types";
import Root from "react-map-gl";
import { findBasemapStyle } from "../util";

export default function Map({
    mapId,
    initBounds,
    children,
    mapProps,
    containerStyle,
}) {
    const { engine } = usePlugin("map-gl"),
        style = findBasemapStyle(children);

    containerStyle = {
        flex: "1",
        minHeight: 200,
        ...containerStyle,
    };

    if (!engine) {
        throw new Error(
            "Must pass maplibre-gl or mapbox-gl to mapgl.setEngine()!  See https://wq.io/@wq/map-gl"
        );
    }

    return (
        <Root
            mapLib={engine}
            id={mapId}
            reuseMaps={Boolean(mapId)}
            mapStyle={style}
            initialViewState={{ bounds: initBounds }}
            style={containerStyle}
            {...mapProps}
        >
            {children}
        </Root>
    );
}

Map.propTypes = {
    mapId: PropTypes.string,
    initBounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object,
};
