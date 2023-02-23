import React, { useMemo } from "react";
import { Source, Layer } from "react-map-gl";
import PropTypes from "prop-types";

const types = ["symbol", "line", "fill", "circle"];

// Same API as react-mapbox-gl's GeoJSONLayer but implemented via react-map-gl

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
    const [source, layers] = useMemo(() => {
        const source = {
            id,
            type: "geojson",
            data,
        };
        const layers = types.map((type) => ({
            id: `${id}-${type}`,
            type,
            paint: rest[`${type}Paint`] || {},
            layout: rest[`${type}Layout`] || {},
        }));

        return [source, layers];
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
        <Source key={id} {...source}>
            {layers.map((layer) => (
                <Layer key={layer.id} {...layer} />
            ))}
        </Source>
    );
}

GeoJSONLayer.propTypes = {
    id: PropTypes.string,
    before: PropTypes.string,
    data: PropTypes.object,
};
