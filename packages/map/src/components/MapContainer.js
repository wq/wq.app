import React from "react";
import { useComponents } from "@wq/react";
import PropTypes from "prop-types";

export default function MapContainer({ children }) {
    const { View } = useComponents();
    return (
        <View
            style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                position: "relative",
            }}
        >
            {children}
        </View>
    );
}

MapContainer.propTypes = {
    children: PropTypes.node,
};
