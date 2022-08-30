import React from 'react';
import { Geojson } from 'react-native-maps';
import PropTypes from 'prop-types';

export default function Highlight({ data }) {
    return (
        <Geojson
            geojson={data}
            color="#0ff"
            fillColor="#0ff"
            strokeColor="#0ff"
        />
    );
}

Highlight.propTypes = {
    data: PropTypes.object
};
