import React, { useEffect } from 'react';
import { useMapInstance } from '@wq/map';
import Geojson from './Geojson';
import PropTypes from 'prop-types';

export default function Draw({ name, data, setData }) {
    const map = useMapInstance(name);

    useEffect(() => {
        if (!map) {
            return;
        }
        map._onPress = evt => {
            setData(evt.nativeEvent.payload.geometry);
        };
        return () => {
            map._onPress = () => null;
        };
    }, [map]);
    if (!data) {
        return null;
    }
    return <Geojson active data={data} />;
}

Draw.propTypes = {
    name: PropTypes.string,
    data: PropTypes.object,
    setData: PropTypes.func
};
