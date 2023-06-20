import React, { useCallback, useState } from "react";
import { usePlugin, usePluginReducer } from "@wq/react";
import PropTypes from "prop-types";
import Root from "react-map-gl";
import { findBasemapStyle } from "../util.js";

export default function Map({
    mapId,
    initBounds,
    children,
    mapProps,
    containerStyle,
}) {
    const { engine } = usePlugin("map-gl"),
        [{ viewState: pluginViewState }, { setViewState: setPluginViewState }] =
            usePluginReducer("map"),
        [localViewState, setLocalViewState] = useState(null),
        viewState = mapId ? pluginViewState : localViewState,
        setViewState = mapId ? setPluginViewState : setLocalViewState,
        onMove = useCallback(
            (evt) => setViewState(evt.viewState),
            [setViewState]
        ),
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
            initialViewState={!viewState && { bounds: initBounds }}
            onMove={onMove}
            style={containerStyle}
            {...mapProps}
            {...viewState}
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
