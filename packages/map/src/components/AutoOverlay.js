import React from "react";
import PropTypes from "prop-types";
import { useOverlayComponents, useDataProps } from "../hooks.js";

export default function AutoOverlay({ type, data, context, ...conf }) {
    const overlays = useOverlayComponents(),
        Overlay = overlays[type],
        dataProps = useDataProps(data, context);

    if (type === "empty") {
        return Overlay ? <Overlay active={conf.active} /> : null;
    } else if (type === "group") {
        const Group = Overlay || React.Fragment;
        return (
            <Group>
                {conf.layers.map((layer) => (
                    <AutoOverlay
                        key={layer.name}
                        active={conf.active}
                        context={context}
                        {...layer}
                    />
                ))}
            </Group>
        );
    } else if (!Overlay) {
        console.warn(`Skipping unrecognized layer type "${type}"`);
        return null;
    }

    return <Overlay {...conf} {...dataProps} />;
}
AutoOverlay.propTypes = {
    type: PropTypes.string.isRequired,
    data: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.arrayOf(PropTypes.string),
    ]),
    context: PropTypes.object,
};
