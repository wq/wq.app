import React from "react";
import PropTypes from "prop-types";
import GeoJSONLayer from "./GeoJSONLayer.js";

export default function Highlight({ data }) {
    return (
        <GeoJSONLayer
            data={data}
            fillPaint={{
                "fill-color": "#0ff",
                "fill-opacity": [
                    "match",
                    ["geometry-type"],
                    ["Polygon", "MultiPolygon"],
                    0.2,
                    0,
                ],
            }}
            linePaint={{
                "line-width": 5,
                "line-color": "#0ff",
                "line-opacity": 1,
            }}
            circlePaint={{
                "circle-color": "#0ff",
                "circle-radius": [
                    "match",
                    ["geometry-type"],
                    ["Point", "MultiPoint"],
                    9,
                    0,
                ],
                "circle-opacity": [
                    "match",
                    ["geometry-type"],
                    ["Point", "MultiPoint"],
                    0.7,
                    0,
                ],
            }}
        />
    );
}

Highlight.propTypes = {
    data: PropTypes.object,
};
