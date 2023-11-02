import React from "react";
import { useIcon } from "@wq/react";
import { IconButton as PaperIconButton, useTheme } from "react-native-paper";
import PropTypes from "prop-types";

export default function IconButton({ icon, onClick, onPress, color, ...rest }) {
    const Icon = useIcon(icon),
        theme = useTheme();
    if (!onPress) {
        onPress = onClick;
    }
    if (color === "primary") {
        color = theme.colors.primary;
    } else if (color === "secondary") {
        color = theme.colors.accent;
    }
    return (
        <PaperIconButton
            icon={Icon}
            onPress={onPress}
            iconColor={color}
            {...rest}
        />
    );
}

IconButton.propTypes = {
    icon: PropTypes.string,
    onClick: PropTypes.func,
    onPress: PropTypes.func,
    color: PropTypes.string,
};
