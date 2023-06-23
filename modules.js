import React from "react";
import jsxRuntime from "react/jsx-runtime";
import ReactDOM from "react-dom";
import ReactIs from "react-is";
import PropTypes from "prop-types";
import * as formik from "formik";
import emStyled from "@emotion/styled";
import * as emReact from "@emotion/react";
import * as muiUtils from "@mui/utils";
import * as muiMaterialUtils from "@mui/material/utils/index.js";
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
    BottomNavigation,
    BottomNavigationAction,
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
    FormGroup,
    FormHelperText,
    FormLabel,
    Grid,
    Hidden,
    Icon,
    IconButton,
    ImageList,
    ImageListItem,
    ImageListItemBar,
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
    Tab,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TablePagination,
    TableRow,
    Tabs,
    TextField,
    ThemeProvider,
    ToggleButton,
    ToggleButtonGroup,
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

// For use with @wq/rollup-plugin
const modules = {
    react: React,
    "react/jsx-runtime": jsxRuntime,
    "react-dom": ReactDOM,
    "react-is": ReactIs,
    "prop-types": PropTypes,
    formik: formik,
    "@emotion/styled": emStyled,
    "@emotion/react": emReact,
    "@mui/utils": muiUtils,
    "@mui/material/utils": muiMaterialUtils,
    "react-map-gl": {
        default: Map,
        ...reactMapGlExports,
    },
    "@mapbox/mapbox-gl-draw": MapboxDraw,
    "@mui/material": {
        Accordion,
        AccordionDetails,
        AccordionSummary,
        Alert,
        AlertTitle,
        AppBar,
        Autocomplete,
        Badge,
        BottomNavigation,
        BottomNavigationAction,
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
        FormGroup,
        FormHelperText,
        FormLabel,
        Grid,
        Hidden,
        Icon,
        IconButton,
        ImageList,
        ImageListItem,
        ImageListItemBar,
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
        Tab,
        Table,
        TableBody,
        TableCell,
        TableContainer,
        TableHead,
        TablePagination,
        TableRow,
        Tabs,
        TextField,
        ThemeProvider,
        ToggleButton,
        ToggleButtonGroup,
        Toolbar,
        Typography,
        createTheme,
        useMediaQuery,
    },
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

function notFound(moduleName, prop) {
    if (moduleName === "@mui/material") {
        return (
            `${prop} is not included in wq.js's copy of ${moduleName}.` +
            ` Try importing ${moduleName}/${prop} directly,` +
            " or file an issue at https://github.com/wq/wq/issues"
        );
    } else {
        return `${prop} not found in wq.js's copy of ${moduleName}!`;
    }
}

for (const [moduleName, value] of Object.entries(modules)) {
    modules[moduleName] = new Proxy(value, {
        get(target, prop) {
            if (!(prop in target)) {
                console.error(notFound(moduleName, prop));
                return () => null;
            }
            return Reflect.get(...arguments);
        },
    });
}

export default modules;
