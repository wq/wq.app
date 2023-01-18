import React from "react";
import { useIcon } from "@wq/react";
import { Button as PaperButton, useTheme } from "react-native-paper";
import PropTypes from "prop-types";

export default function Button({
    onClick,
    onPress,
    variant,
    mode,
    icon,
    color,
    ...rest
}) {
    const Icon = useIcon(icon),
        theme = useTheme();
    if (!onPress) {
        onPress = onClick;
    }
    if (!mode) {
        mode = variant;
    }
    if (color === "primary") {
        color = theme.colors.primary;
    } else if (color === "secondary") {
        color = theme.colors.accent;
    }
    return (
        <PaperButton
            onPress={onPress}
            mode={mode}
            icon={Icon}
            color={color}
            {...rest}
        />
    );
}

Button.propTypes = {
    onClick: PropTypes.func,
    onPress: PropTypes.func,
    variant: PropTypes.string,
    mode: PropTypes.string,
    icon: PropTypes.string,
    color: PropTypes.string,
};
