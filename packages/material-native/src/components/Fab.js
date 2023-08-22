import React from "react";
import { FAB } from "react-native-paper";
import { useNav, useIcon } from "@wq/react";
import PropTypes from "prop-types";

export default function Fab({ icon, to, ...rest }) {
    const onPress = useNav(to),
        Icon = useIcon(icon);

    return (
        <FAB
            onPress={onPress}
            icon={Icon}
            style={{
                position: "absolute",
                margin: 16,
                right: 0,
                bottom: 0,
            }}
            {...rest}
        />
    );
}

Fab.propTypes = {
    icon: PropTypes.string,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
