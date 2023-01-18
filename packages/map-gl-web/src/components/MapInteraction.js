import React from "react";
import { NavigationControl, ScaleControl } from "react-map-gl";

export default function MapInteraction() {
    return (
        <>
            <NavigationControl position="top-left" />
            <ScaleControl />
        </>
    );
}
