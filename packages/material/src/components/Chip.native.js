import React from 'react';
import { useIconComponents } from '@wq/react';
import { Chip as PaperChip, useTheme } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function Chip({
    label,
    icon,
    color,
    onClick,
    onPress,
    onDelete,
    onClose,
    ...rest
}) {
    const theme = useTheme(),
        icons = useIconComponents(),
        Icon = icon ? icons[icon] : null;

    if (color === 'primary') {
        color = theme.colors.primary;
    } else if (color === 'secondary') {
        color = theme.colors.accent;
    }

    let style, chipTheme;
    if (color) {
        style = {
            backgroundColor: color
        };
        chipTheme = {
            colors: {
                text: '#ffffff'
            }
        };
    }

    if (!onPress) {
        onPress = onClick;
    }

    if (!onClose) {
        onClose = onDelete;
    }

    return (
        <PaperChip
            icon={Icon}
            style={style}
            theme={chipTheme}
            onPress={onPress}
            onClose={onClose}
            {...rest}
        >
            {label}
        </PaperChip>
    );
}

Chip.propTypes = {
    label: PropTypes.node,
    icon: PropTypes.string,
    color: PropTypes.string,
    onClick: PropTypes.func,
    onPress: PropTypes.func,
    onDelete: PropTypes.func,
    onClose: PropTypes.func
};
