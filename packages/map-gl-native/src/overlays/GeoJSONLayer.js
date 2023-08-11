import React, { useMemo } from "react";
import { ShapeSource, Style } from "@maplibre/maplibre-react-native";
import PropTypes from "prop-types";

const types = ["symbol", "line", "fill", "circle"];

export default function GeoJSONLayer({ id, before, data, ...rest }) {
    if (!id) {
        const ids =
            data && data.features
                ? data.features.map((feature) => feature.id)
                : [];
        id = `_geojson_${ids.join("_")}`;
    }
    const {
        symbolLayout,
        symbolPaint,
        fillLayout,
        fillPaint,
        lineLayout,
        linePaint,
        circleLayout,
        circlePaint,
    } = rest;
    const [sourceProps, style] = useMemo(() => {
        const sourceProps = {
            id,
        };
        if (typeof data === "string") {
            sourceProps.url = data;
        } else {
            sourceProps.shape = data;
        }
        const layers = types.map((type) => ({
            id: `${id}-${type}`,
            source: id,
            type,
            paint: rest[`${type}Paint`] || {},
            layout: rest[`${type}Layout`] || {},
        }));

        return [sourceProps, { layers }];
    }, [
        id,
        before,
        data,
        symbolLayout,
        symbolPaint,
        fillLayout,
        fillPaint,
        lineLayout,
        linePaint,
        circleLayout,
        circlePaint,
    ]);

    return (
        <ShapeSource {...sourceProps}>
            <Style json={style} />
        </ShapeSource>
    );
}

GeoJSONLayer.propTypes = {
    id: PropTypes.string,
    before: PropTypes.string,
    data: PropTypes.object,
};
