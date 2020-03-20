import React from 'react';
import { FAB } from 'react-native-paper';
import { useOnPress } from '../hooks';
import PropTypes from 'prop-types';

const icons = {
    add: 'plus',
    edit: 'pencil'
};
export default function Fab({ type, to }) {
    const onPress = useOnPress(to);
    const icon = icons[type];
    return (
        <FAB
            onPress={onPress}
            icon={icon}
            color="white"
            style={{
                position: 'absolute',
                margin: 16,
                right: 0,
                bottom: 0
            }}
        />
    );
}

Fab.propTypes = {
    type: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
