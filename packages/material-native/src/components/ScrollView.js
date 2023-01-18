import React from "react";
import { ScrollView as PaperScrollView } from "react-native";
import { useTheme } from "react-native-paper";
import PropTypes from "prop-types";

export default function ScrollView({ style, ...rest }) {
    const theme = useTheme();
    return (
        <PaperScrollView
            style={{
                flex: 1,
                backgroundColor: theme.colors.background,
                ...style,
            }}
            {...rest}
        />
    );
}

ScrollView.propTypes = {
    style: PropTypes.object,
};
