import React from "react";
import jsxRuntime from "react/jsx-runtime";
import ReactDOM from "react-dom";
import ReactIs from "react-is";
import PropTypes from "prop-types";
import * as formik from "formik";
import emStyled from "@emotion/styled";
import * as emReact from "@emotion/react";
import * as muiUtils from "@mui/utils";
import Map, * as reactMapGlExports from "react-map-gl";
import MapboxDraw from "@mapbox/mapbox-gl-draw";

import {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    AlertTitle,
    AppBar,
    Autocomplete,
    Badge,
    Box,
    Breadcrumbs,
    Button,
    ButtonBase,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    CssBaseline,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Fab,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    Menu,
    MenuItem,
    Modal,
    Paper,
    Radio,
    Select,
    SvgIcon,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    ThemeProvider,
    ToggleButton,
    Toolbar,
    Typography,
    createTheme,
    useMediaQuery,
} from "@mui/material";

import app from "@wq/app";
import material, * as materialExports from "@wq/material";
import react, * as reactExports from "@wq/react";
import map, * as mapExports from "@wq/map";
import mapgl, * as mapglExports from "@wq/map-gl";

const muiMaterial = {
    Accordion,
    AccordionDetails,
    AccordionSummary,
    Alert,
    AlertTitle,
    AppBar,
    Autocomplete,
    Badge,
    Box,
    Breadcrumbs,
    Button,
    ButtonBase,
    Card,
    CardContent,
    Checkbox,
    Chip,
    CircularProgress,
    Collapse,
    CssBaseline,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    Divider,
    Drawer,
    Fab,
    FormControl,
    FormControlLabel,
    FormHelperText,
    FormLabel,
    Grid,
    IconButton,
    InputLabel,
    LinearProgress,
    Link,
    List,
    ListItem,
    ListItemIcon,
    ListItemSecondaryAction,
    ListItemText,
    ListSubheader,
    Menu,
    MenuItem,
    Modal,
    Paper,
    Radio,
    Select,
    SvgIcon,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    TextField,
    ThemeProvider,
    ToggleButton,
    Toolbar,
    Typography,
    createTheme,
    useMediaQuery,
};

// For use with @wq/rollup-plugin
export default {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "react-dom": ReactDOM,
    "react-is": ReactIs,
    "prop-types": PropTypes,
    formik: formik,
    "@emotion/styled": emStyled,
    "@emotion/react": emReact,
    "@mui/utils": muiUtils,
    "react-map-gl": {
        default: Map,
        ...reactMapGlExports,
    },
    "@mapbox/mapbox-gl-draw": MapboxDraw,
    "@mui/material": new Proxy(muiMaterial, {
        get: function (target, prop) {
            if (!(prop in target)) {
                console.error(
                    `${prop} is not included in wq.js's copy of @mui/material.` +
                        ` Try importing @mui/material/${prop} directly,` +
                        " or file an issue at https://github.com/wq/wq/issues"
                );
                return () => null;
            }
            return Reflect.get(...arguments);
        },
    }),
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
