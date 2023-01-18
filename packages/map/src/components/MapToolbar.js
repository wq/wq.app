import React from "react";
import PropTypes from "prop-types";
import { useComponents } from "@wq/react";
import { useMapInstance } from "../hooks";

export default function MapToolbar({
    name,
    overlays,
    basemaps,
    showOverlay,
    hideOverlay,
    setBasemap,
    children,
}) {
    const { SidePanel, List, ListSubheader, OverlayToggle, BasemapToggle } =
            useComponents(),
        map = useMapInstance(name),
        hasMultipleOverlays =
            overlays &&
            (overlays.length > 1 || overlays.some((conf) => conf.legend)),
        hasMultipleBasemaps = basemaps && basemaps.length > 1;

    if (!hasMultipleOverlays && !hasMultipleBasemaps) {
        return null;
    }

    function resize() {
        if (map && map.resize) {
            map.resize();
        }
    }

    return (
        <SidePanel onChange={resize}>
            {children}
            <List dense>
                {hasMultipleOverlays && (
                    <>
                        <ListSubheader>Layers</ListSubheader>
                        {overlays.map((conf) => (
                            <OverlayToggle
                                key={conf.name}
                                name={conf.name}
                                legend={conf.legend}
                                active={conf.active}
                                setActive={(active) =>
                                    active
                                        ? showOverlay(conf.name)
                                        : hideOverlay(conf.name)
                                }
                            />
                        ))}
                    </>
                )}
                {hasMultipleBasemaps && (
                    <>
                        <ListSubheader>Basemap</ListSubheader>
                        {basemaps.map((conf) => (
                            <BasemapToggle
                                key={conf.name}
                                name={conf.name}
                                active={conf.active}
                                setActive={(active) =>
                                    active && setBasemap(conf.name)
                                }
                            />
                        ))}
                    </>
                )}
            </List>
        </SidePanel>
    );
}

MapToolbar.propTypes = {
    name: PropTypes.string,
    overlays: PropTypes.arrayOf(PropTypes.object),
    basemaps: PropTypes.arrayOf(PropTypes.object),
    showOverlay: PropTypes.func,
    hideOverlay: PropTypes.func,
    setBasemap: PropTypes.func,
    children: PropTypes.node,
};
