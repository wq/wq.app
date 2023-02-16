import React from "react";
import Geojson from "./Geojson.js";
import circle from "@turf/circle";
import PropTypes from "prop-types";

export default function Accuracy({ accuracy, data }) {
    const geometry =
        data && data.features && data.features[0] && data.features[0].geometry;
    if (!accuracy || !geometry || geometry.type !== "Point") {
        return null;
    }
    const circleData = circle(geometry.coordinates, accuracy / 1000);
    return <Geojson name="accuracy" active data={circleData} />;
}

Accuracy.propTypes = {
    accuracy: PropTypes.number,
    data: PropTypes.object,
};
