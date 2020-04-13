import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Button({ onClick, onPress, variant, mode, ...rest }) {
    if (!onPress) {
        onPress = onClick;
    }
    if (!mode) {
        mode = variant;
    }
    return <PaperButton onPress={onPress} mode={mode} {...rest} />;
}

Button.propTypes = {
    onClick: PropTypes.func,
    onPress: PropTypes.func,
    variant: PropTypes.string,
    mode: PropTypes.string
};
