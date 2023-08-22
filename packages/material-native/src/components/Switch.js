import React from "react";
import { Switch as PaperSwitch, useTheme } from "react-native-paper";
import PropTypes from "prop-types";

export default function Switch({ checked: value, color, ...rest }) {
    const theme = useTheme();
    if (color === "primary") {
        color = theme.colors.primary;
    } else if (color === "secondary") {
        color = theme.colors.accent;
    }
    return <PaperSwitch value={value} {...rest} />;
}

Switch.propTypes = {
    checked: PropTypes.bool,
    color: PropTypes.string,
};
