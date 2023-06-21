import React from "react";
import PropTypes from "prop-types";
import { useComponents } from "@wq/react";

export default function MapToolbar({
    overlays,
    basemaps,
    showOverlay,
    hideOverlay,
    setBasemap,
    children,
    anchor,
}) {
    const { SidePanel, List, ListSubheader, OverlayToggle, BasemapToggle } =
            useComponents(),
        hasMultipleOverlays =
            overlays &&
            (overlays.length > 1 || overlays.some((conf) => conf.legend)),
        hasMultipleBasemaps = basemaps && basemaps.length > 1;

    if (!hasMultipleOverlays && !hasMultipleBasemaps) {
        return null;
    }

    return (
        <SidePanel anchor={anchor}>
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
    mapId: PropTypes.string,
    overlays: PropTypes.arrayOf(PropTypes.object),
    basemaps: PropTypes.arrayOf(PropTypes.object),
    showOverlay: PropTypes.func,
    hideOverlay: PropTypes.func,
    setBasemap: PropTypes.func,
    children: PropTypes.node,
    anchor: PropTypes.string,
};
