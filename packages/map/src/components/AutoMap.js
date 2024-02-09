import React, { useMemo } from "react";
import { useComponents, usePlugin } from "@wq/react";
import { useMapState, useOverlayComponents } from "../hooks.js";
import PropTypes from "prop-types";

export default function AutoMap({
    name,
    mapId,
    toolbar = true,
    toolbarAnchor = "top-right",
    containerStyle,
    context,
    state,
    children,
}) {
    const mapState = useMapState(),
        { showOverlay, hideOverlay, setBasemap } = usePlugin("map"),
        {
            MapContainer,
            MapToolbar,
            Map,
            MapInteraction,
            MapAutoZoom,
            MapIdentify,
            MapLayers,
            AutoBasemap,
            AutoOverlay,
        } = useComponents(),
        { Highlight } = useOverlayComponents();

    if (!state) {
        state = mapState;
    }

    if (!state) {
        return null;
    }

    const {
        basemaps,
        overlays,
        initBounds,
        tiles,
        mapProps,
        autoZoom,
        highlight,
    } = state;

    const defaultTileSource = useMemo(() => {
        if (!tiles) {
            return null;
        }
        const origin = tiles.startsWith("/") ? window.location.origin : "";
        return {
            name: "Default Tile Source",
            type: "vector-tile",
            style: {
                sources: {
                    _default: {
                        type: "vector",
                        tiles: [origin + tiles],
                    },
                },
                layers: [],
            },
        };
    }, [tiles]);

    const identify = overlays.some((overlay) => !!overlay.popup);

    if (toolbar === true) {
        toolbar = (
            <MapToolbar
                name={name}
                mapId={mapId}
                basemaps={basemaps}
                overlays={overlays}
                showOverlay={showOverlay}
                hideOverlay={hideOverlay}
                setBasemap={setBasemap}
                context={context}
                anchor={toolbarAnchor}
            />
        );
    } else if (!toolbar) {
        toolbar = false;
    }

    return (
        <MapContainer name={name} mapId={mapId}>
            {toolbarAnchor.endsWith("left") && toolbar}
            <Map
                name={name}
                mapId={mapId}
                initBounds={initBounds}
                mapProps={mapProps}
                containerStyle={containerStyle}
            >
                <MapInteraction name={name} mapId={mapId} />
                {!!autoZoom && (
                    <MapAutoZoom
                        name={name}
                        mapId={mapId}
                        context={context}
                        {...autoZoom}
                    />
                )}
                {identify && (
                    <MapIdentify name={name} mapId={mapId} context={context} />
                )}
                <MapLayers>
                    {defaultTileSource && (
                        <AutoOverlay active {...defaultTileSource} />
                    )}
                    {basemaps.map((conf) => (
                        <AutoBasemap key={conf.name} {...conf} />
                    ))}
                    {overlays.map((conf) => (
                        <AutoOverlay
                            key={conf.name}
                            {...conf}
                            context={context}
                        />
                    ))}
                </MapLayers>
                {highlight && <Highlight data={highlight} />}
                {children}
            </Map>
            {toolbarAnchor.endsWith("right") && toolbar}
        </MapContainer>
    );
}

AutoMap.propTypes = {
    name: PropTypes.string,
    mapId: PropTypes.string,
    toolbar: PropTypes.bool,
    toolbarAnchor: PropTypes.string,
    containerStyle: PropTypes.object,
    context: PropTypes.object,
    state: PropTypes.object,
    children: PropTypes.node,
};
