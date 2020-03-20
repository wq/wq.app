import React from 'react';
import { Appbar } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Header({ navigation, scene, previous }) {
    return (
        <Appbar.Header>
            {previous && (
                <Appbar.BackAction onPress={() => navigation.goBack()} />
            )}
            <Appbar.Content title={scene && scene.descriptor.options.title} />
        </Appbar.Header>
    );
}

Header.propTypes = {
    navigation: PropTypes.object,
    scene: PropTypes.object,
    previous: PropTypes.object
};
