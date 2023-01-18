import React from "react";
import ReactDOM from "react-dom";
import ReactIs from "react-is";
import PropTypes from "prop-types";
import * as formik from "formik";
import * as muiUtils from "@mui/utils";
import ButtonBase from "@mui/material/ButtonBase";
import Paper from "@mui/material/Paper";
import Map, * as reactMapGlExports from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import app from "@wq/app";
import material, * as materialExports from "@wq/material";
import react, * as reactExports from "@wq/react";
import map, * as mapExports from "@wq/map";
import mapgl, * as mapglExports from "@wq/map-gl";

// For use with @wq/rollup-plugin
export default {
    react: React,
    "react-dom": ReactDOM,
    "react-is": ReactIs,
    "prop-types": PropTypes,
    formik: formik,
    "@mui/utils": muiUtils,
    "@mui/material/ButtonBase": ButtonBase,
    "@mui/material/Paper": Paper,
    "react-map-gl": {
        default: Map,
        ...reactMapGlExports,
    },
    "@mapbox/mapbox-gl-draw": MapboxDraw,
    "@wq/app": app,
    "@wq/react": {
        default: react,
        ...reactExports,
    },
    "@wq/material": {
        default: material,
        ...materialExports,
    },
    "@wq/map": {
        default: map,
        ...mapExports,
    },
    "@wq/map-gl": {
        default: mapgl,
        ...mapglExports,
    },
};
