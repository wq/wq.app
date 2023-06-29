import React from "react";
import { useMapState } from "../hooks.js";
import { DefaultList, useComponents, useList } from "@wq/react";
import { useMinWidth } from "@wq/material";

export default function DefaultListWithMap() {
    const mapState = useMapState(),
        { MapProvider, AutoMap, HighlightPopup, Divider, TabGroup, TabItem } =
            useComponents(),
        splitScreen = useMinWidth(900),
        context = useList();
    if (mapState) {
        const { mapId } = mapState;
        if (splitScreen) {
            return (
                <MapProvider>
                    <DefaultList />
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
                        <TabItem label="List" value="list" icon="list">
                            <DefaultList />
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
        return <DefaultList />;
    }
}
