import React, { useEffect, useMemo, useContext } from "react";
import PropTypes from "prop-types";
import MapLibreGL from "@maplibre/maplibre-react-native";
import { findBasemapStyle } from "../util.js";
import { MapContext } from "./MapProvider.js";

export default function Map({
    name,
    initBounds,
    children,
    mapProps,
    containerStyle,
}) {
    const {
        accessToken = null,
        dragRotate: rotateEnabled,
        pitchWithRotate: pitchEnabled = mapProps && mapProps.dragRotate,
    } = mapProps || {};
    useEffect(() => {
        MapLibreGL.setAccessToken(accessToken);
    }, [accessToken]);

    const { setInstance } = useContext(MapContext),
        fitBounds = useMemo(() => {
            const [[xmin, ymin], [xmax, ymax]] = initBounds;
            return { sw: [xmin, ymin], ne: [xmax, ymax] };
        }, [initBounds]),
        style = findBasemapStyle(children),
        styleURL = typeof style === "string" ? style : null,
        styleJSON =
            !style || typeof style === "string" ? null : JSON.stringify(style);
    const mapRef = React.useRef(),
        setMapRef = React.useCallback((ref) => {
            mapRef.current = ref;
            if (ref && cameraRef.current) {
                ref.camera = cameraRef.current;
            }
            if (ref) {
                setInstance(ref, name);
            }
        }, []),
        cameraRef = React.useRef(),
        setCameraRef = React.useCallback((ref) => {
            cameraRef.current = ref;
            if (ref && mapRef.current) {
                mapRef.current.camera = ref;
            }
        }, []);

    containerStyle = {
        flex: 1,
        minHeight: 200,
        ...containerStyle,
    };

    return (
        <MapLibreGL.MapView
            styleURL={styleURL}
            styleJSON={styleJSON}
            ref={setMapRef}
            rotateEnabled={rotateEnabled}
            pitchEnabled={pitchEnabled}
            attributionEnabled={!!accessToken}
            logoEnabled={!!accessToken}
            style={containerStyle}
        >
            <MapLibreGL.Camera
                bounds={fitBounds}
                ref={setCameraRef}
                animationDuration={0}
            />
            {children}
        </MapLibreGL.MapView>
    );
}

Map.propTypes = {
    name: PropTypes.string,
    initBounds: PropTypes.array,
    children: PropTypes.node,
    mapProps: PropTypes.object,
    containerStyle: PropTypes.object,
};
