import React from "react";
import { useMapState } from "../hooks";
import { DefaultDetail, useComponents, useRenderContext } from "@wq/react";

export default function DefaultDetailWithMap() {
    const mapState = useMapState(),
        { MapProvider, AutoMap } = useComponents(),
        context = useRenderContext();
    if (mapState) {
        const { mapId } = mapState;
        return (
            <MapProvider>
                <DefaultDetail />
                <AutoMap mapId={mapId} context={context} />
            </MapProvider>
        );
    } else {
        return <DefaultDetail />;
    }
}
