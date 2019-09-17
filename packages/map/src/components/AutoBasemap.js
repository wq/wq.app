import React from 'react';
import PropTypes from 'prop-types';
import { useBasemapComponents } from '../hooks';

export default function AutoBasemap({ type, ...conf }) {
    const basemaps = useBasemapComponents();
    const Basemap = basemaps[type];
    if (!Basemap) {
        console.warn(`Skipping unrecognized layer type "${type}"`);
        return null;
    }
    return <Basemap {...conf} />;
}
AutoBasemap.propTypes = {
    type: PropTypes.string.isRequired
};
