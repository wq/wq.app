import React from "react";
import { View } from "react-native";
import PropTypes from "prop-types";

export default function HorizontalView({ style, ...rest }) {
    return (
        <View
            style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 8,
                ...style,
            }}
            {...rest}
        />
    );
}

HorizontalView.propTypes = {
    style: PropTypes.object,
};
