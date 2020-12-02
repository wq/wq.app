import React from 'react';
import { useIcon } from '@wq/react';
import { IconButton as PaperIconButton } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function IconButton({ icon, onClick, onPress, ...rest }) {
    const Icon = useIcon(icon);
    if (!onPress) {
        onPress = onClick;
    }
    return <PaperIconButton icon={Icon} onPress={onPress} {...rest} />;
}

IconButton.propTypes = {
    icon: PropTypes.string,
    onClick: PropTypes.func,
    onPress: PropTypes.func
};
