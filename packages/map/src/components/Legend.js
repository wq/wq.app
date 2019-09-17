import React from 'react';
import PropTypes from 'prop-types';
import { LayersControl } from 'react-leaflet';
const { BaseLayer, Overlay } = LayersControl;

export default function Legend({ position, collapsed, children }) {
    if (!position) {
        position = 'topright';
    }
    if (collapsed === undefined) {
        collapsed = true;
    }
    return (
        <LayersControl position={position} collapsed={collapsed}>
            {children}
        </LayersControl>
    );
}
Legend.propTypes = {
    position: PropTypes.object,
    collapsed: PropTypes.bool,
    children: PropTypes.node
};

export function BasemapToggle({ name, active, children, ...rest }) {
    return (
        <BaseLayer name={name} checked={active} {...rest}>
            {children}
        </BaseLayer>
    );
}
BasemapToggle.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    children: PropTypes.node
};

export function OverlayToggle({ name, active, children, ...rest }) {
    return (
        <Overlay name={name} checked={active} {...rest}>
            {children}
        </Overlay>
    );
}
OverlayToggle.propTypes = {
    name: PropTypes.string,
    active: PropTypes.bool,
    children: PropTypes.node
};
