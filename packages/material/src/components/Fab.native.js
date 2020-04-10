import React from 'react';
import { FAB } from 'react-native-paper';
import { useOnPress } from '../hooks';
import { useIconComponents } from '@wq/react';
import PropTypes from 'prop-types';

export default function Fab({ icon, to }) {
    const onPress = useOnPress(to),
        { [icon]: Icon } = useIconComponents();

    return (
        <FAB
            onPress={onPress}
            icon={Icon}
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
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
