import React from "react";
import PropTypes from "prop-types";
import { useBasemapComponents } from "../hooks.js";

export default function AutoBasemap({ type, ...conf }) {
    const basemaps = useBasemapComponents(),
        Basemap = basemaps[type];

    if (type === "empty") {
        return Basemap ? <Basemap active={conf.active} /> : null;
    } else if (type === "group") {
        const Group = Basemap || React.Fragment;
        return (
            <Group>
                {conf.layers.map((layer) => (
                    <AutoBasemap
                        key={layer.name}
                        active={conf.active}
                        {...layer}
                    />
                ))}
            </Group>
        );
    } else if (!Basemap) {
        console.warn(`Skipping unrecognized layer type "${type}"`);
        return null;
    }

    return <Basemap {...conf} />;
}
AutoBasemap.propTypes = {
    type: PropTypes.string.isRequired,
};
AutoBasemap.isAutoBasemap = true;
