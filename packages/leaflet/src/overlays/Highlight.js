import React from 'react';
import PropTypes from 'prop-types';
import { GeoJSON } from 'react-leaflet';

export default function Highlight({ data }) {
    function style() {
        return {
            color: '#00ffff'
        };
    }
    return <GeoJSON data={data} style={style} />;
}

Highlight.propTypes = {
    data: PropTypes.object
};
