import React from "react";
import { useMapState } from "../hooks";
import { DefaultList, useComponents, useList } from "@wq/react";

export default function DefaultListWithMap() {
    const mapState = useMapState(),
        { MapProvider, AutoMap, HighlightPopup } = useComponents(),
        context = useList();
    if (mapState) {
        const { mapId } = mapState;
        return (
            <MapProvider>
                <DefaultList />
                <AutoMap mapId={mapId} context={context} />
                <HighlightPopup />
            </MapProvider>
        );
    } else {
        return <DefaultList />;
    }
}
