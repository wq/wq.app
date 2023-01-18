import React from "react";
import { useComponents, usePlugin } from "@wq/react";
import { useMapState, useOverlayComponents } from "../hooks";
import PropTypes from "prop-types";

export default function AutoMap({
    name,
    toolbar = true,
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

    const { basemaps, overlays, initBounds, mapProps, autoZoom, highlight } =
        state;

    const identify = overlays.some((overlay) => !!overlay.popup);

    return (
        <MapContainer name={name}>
            {toolbar && (
                <MapToolbar
                    name={name}
                    basemaps={basemaps}
                    overlays={overlays}
                    showOverlay={showOverlay}
                    hideOverlay={hideOverlay}
                    setBasemap={setBasemap}
                    context={context}
                />
            )}
            <Map
                name={name}
                initBounds={initBounds}
                mapProps={mapProps}
                containerStyle={containerStyle}
            >
                <MapInteraction name={name} />
                {!!autoZoom && (
                    <MapAutoZoom name={name} context={context} {...autoZoom} />
                )}
                {identify && <MapIdentify name={name} context={context} />}
                <MapLayers>
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
        </MapContainer>
    );
}

AutoMap.makeComponent = (props) => {
    function Component() {
        return <AutoMap {...props} />;
    }

    return Component;
};

AutoMap.propTypes = {
    name: PropTypes.string,
    toolbar: PropTypes.bool,
    containerStyle: PropTypes.object,
    context: PropTypes.object,
    state: PropTypes.object,
    children: PropTypes.node,
};
