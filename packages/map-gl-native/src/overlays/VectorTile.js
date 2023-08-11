import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Style } from "@maplibre/maplibre-react-native";

export default function VectorTile({ active, url, style }) {
    const json = useMarkVisible(style || url, active);
    return <Style json={json} />;
}

function useMarkVisible(style, active) {
    return useMemo(() => {
        return {
            ...style,
            layers: (style.layers || []).map((layer) => {
                return {
                    ...layer,
                    layout: {
                        ...(layer.layout || {}),
                        visibility: active ? "visible" : "none",
                    },
                };
            }),
        };
    }, [style, active]);
}

VectorTile.propTypes = {
    active: PropTypes.bool,
    style: PropTypes.object,
    url: PropTypes.string,
};
