import React from 'react';
import ReactDOM from 'react-dom';
import ReactIs from 'react-is';
import PropTypes from 'prop-types';
import * as formik from 'formik';
import * as muiUtils from '@material-ui/utils';
import * as muiStyles from '@material-ui/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import Paper from '@material-ui/core/Paper';
import withStyles from '@material-ui/core/styles/withStyles';
import * as colorManipulator from '@material-ui/core/styles/colorManipulator';
import mapboxgl from 'mapbox-gl';
import ReactMapboxGl, * as reactMapboxGlExports from 'react-mapbox-gl';

import app from '@wq/app';
import material, * as materialExports from '@wq/material';
import react, * as reactExports from '@wq/react';
import map, * as mapExports from '@wq/map';
import mapbox, * as mapboxExports from '@wq/mapbox';

// For use with @wq/rollup-plugin
export default {
    react: React,
    'react-dom': ReactDOM,
    'react-is': ReactIs,
    'prop-types': PropTypes,
    formik: formik,
    '@material-ui/utils': muiUtils,
    '@material-ui/styles': muiStyles,
    '@material-ui/core/ButtonBase': ButtonBase,
    '@material-ui/core/Paper': Paper,
    '@material-ui/core/styles/withStyles': withStyles,
    '@material-ui/core/styles/colorManipulator': colorManipulator,
    'mapbox-gl': mapboxgl,
    'react-mapbox-gl': {
        default: ReactMapboxGl,
        ...reactMapboxGlExports
    },
    '@wq/app': app,
    '@wq/react': {
        default: react,
        ...reactExports
    },
    '@wq/material': {
        default: material,
        ...materialExports
    },
    '@wq/map': {
        default: map,
        ...mapExports
    },
    '@wq/mapbox': {
        default: mapbox,
        ...mapboxExports
    }
};
