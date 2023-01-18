import React from "react";

export function findBasemapStyle(children) {
    let style = null;
    React.Children.toArray(children).some((child) => {
        if (!child || !child.props) {
            return false;
        }
        const { active, children } = child.props;
        let { type } = child;
        if (type && type.isAutoBasemap) {
            type = type(child.props).type;
        }
        if (active && type && type.asBasemapStyle) {
            style = type.asBasemapStyle(child.props);
        } else if (children) {
            style = findBasemapStyle(children);
        }
        return !!style;
    });
    return style;
}

export function zoomToLocation(instance, geometry) {
    if (geometry.type == "Point") {
        instance.camera.setCamera({
            centerCoordinate: geometry.coordinates,
            zoomLevel: 18,
            animationDuration: 2000,
        });
    } else {
        // FIXME
    }
}
