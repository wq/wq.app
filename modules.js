import React from 'react';
import ReactDOM from 'react-dom';
import PropTypes from 'prop-types';
import * as muiUtils from '@material-ui/utils';
import * as muiStyles from '@material-ui/styles';
import ButtonBase from '@material-ui/core/ButtonBase';
import withStyles from '@material-ui/core/styles/withStyles';
import * as colorManipulator from '@material-ui/core/styles/colorManipulator';
import mapboxgl from 'mapbox-gl';

import app from '@wq/app';
import material, * as materialExports from '@wq/material';
import react, * as reactExports from '@wq/react';
import map, * as mapExports from '@wq/map';
import mapbox, * as mapboxExports from '@wq/mapbox';

// For use with @wq/rollup-plugin
export default {
    react: React,
    'react-dom': ReactDOM,
    'prop-types': PropTypes,
    '@material-ui/utils': muiUtils,
    '@material-ui/styles': muiStyles,
    '@material-ui/core/ButtonBase': ButtonBase,
    '@material-ui/core/styles/withStyles': withStyles,
    '@material-ui/core/styles/colorManipulator': colorManipulator,
    'mapbox-gl': mapboxgl,
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
