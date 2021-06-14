import React from 'react';
import { useComponents, useInputComponents } from '@wq/react';
import { useGeoTools } from '../hooks';
import PropTypes from 'prop-types';

export default function GeoTools({ name, type }) {
    const {
            toggleProps,
            setLocation,
            setBounds,
            ActiveTool,
            value
        } = useGeoTools(name, type),
        { View } = useComponents(),
        { Toggle } = useInputComponents();

    return (
        <View
            style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center'
            }}
        >
            <View style={{ marginRight: 8 }}>
                <Toggle {...toggleProps} />
            </View>
            <ActiveTool
                name={name}
                value={value}
                type={type}
                setLocation={setLocation}
                setBounds={setBounds}
            />
        </View>
    );
}

GeoTools.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string
};
