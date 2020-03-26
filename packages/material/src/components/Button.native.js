import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Button({ onClick, onPress, ...rest }) {
    if (!onPress) {
        onPress = onClick;
    }
    return <PaperButton onPress={onPress} {...rest} />;
}

Button.propTypes = {
    onClick: PropTypes.func,
    onPress: PropTypes.func
};
