import React from "react";
import { useMapState } from "../hooks.js";
import { DefaultDetail, useComponents, useRenderContext } from "@wq/react";
import { useMinWidth } from "@wq/material";

export default function DefaultDetailWithMap() {
    const mapState = useMapState(),
        { MapProvider, AutoMap, HighlightPopup, Divider, TabGroup, TabItem } =
            useComponents(),
        splitScreen = useMinWidth(900),
        context = useRenderContext();
    if (mapState) {
        const { mapId } = mapState;
        if (splitScreen) {
            return (
                <MapProvider>
                    <DefaultDetail />
                    <Divider orientation="vertical" />
                    <AutoMap mapId={mapId} context={context}>
                        <HighlightPopup inMap />
                    </AutoMap>
                    <HighlightPopup />
                </MapProvider>
            );
        } else {
            return (
                <MapProvider>
                    <TabGroup sx={{ minHeight: 72 }}>
                        <TabItem label="Detail" value="detail" icon="detail">
                            <DefaultDetail />
                        </TabItem>
                        <TabItem label="Map" value="map" icon="map">
                            <AutoMap mapId={mapId} context={context} />
                            <HighlightPopup />
                        </TabItem>
                    </TabGroup>
                </MapProvider>
            );
        }
    } else {
        return <DefaultDetail />;
    }
}
