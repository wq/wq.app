import React from 'react';
import { UrlTile } from 'react-native-maps';
import PropTypes from 'prop-types';

export default function Tile({ url }) {
    return <UrlTile urlTemplate={url} />;
}

Tile.propTypes = {
    url: PropTypes.string
};
