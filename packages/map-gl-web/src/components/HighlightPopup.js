import React, { useMemo } from "react";
import { Popup } from "react-map-gl";
import {
    HighlightPopup as ModalPopup,
    HighlightContent,
    computeBounds,
} from "@wq/map";
import { usePluginReducer } from "@wq/react";
import { useMinWidth } from "@wq/material";

export default function HighlightPopup({ inMap }) {
    const showInMap = useMinWidth(600);
    if (inMap && !showInMap) {
        return null;
    } else if (!inMap && showInMap) {
        return null;
    } else if (inMap) {
        return <InMapPopup />;
    } else {
        return <ModalPopup />;
    }
}

export function InMapPopup() {
    const [{ highlight }, { clearHighlight }] = usePluginReducer("map"),
        [longitude, latitude] = useMemo(
            () => findPoint(highlight),
            [highlight]
        );
    if (!highlight || latitude === null || longitude === null) {
        return null;
    }
    return (
        <Popup
            latitude={latitude}
            longitude={longitude}
            onClose={clearHighlight}
            maxWidth="80vw"
        >
            <div style={{ maxHeight: "40vh", overflowY: "auto" }}>
                {highlight.features.map((feature) => (
                    <HighlightContent
                        key={feature.id}
                        feature={feature}
                        inMap
                    />
                ))}
            </div>
        </Popup>
    );
}

function findPoint(highlight) {
    if (!highlight || !highlight.features || !highlight.features.length) {
        return [null, null];
    }
    const point = highlight.features.find(
        (feature) => feature.geometry && feature.geometry.type === "Point"
    );

    if (point) {
        return point.geometry.coordinates;
    } else {
        const bounds = computeBounds(highlight.features);
        if (bounds) {
            const [[minx, miny], [maxx, maxy]] = bounds;
            return [(minx + maxx) / 2, (miny + maxy) / 2];
        } else {
            return [0, 0];
        }
    }
}
