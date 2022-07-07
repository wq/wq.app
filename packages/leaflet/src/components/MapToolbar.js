import React from 'react';
import PropTypes from 'prop-types';
import { LayersControl } from 'react-leaflet';
const { BaseLayer, Overlay } = LayersControl;
import { useComponents } from '@wq/react';

export default function MapToolbar({
    overlays,
    basemaps,
    context,
    position,
    collapsed
}) {
    const {
        AutoBasemap,
        AutoOverlay,
        BasemapToggle,
        OverlayToggle
    } = useComponents();
    if (!position) {
        position = 'topright';
    }
    if (collapsed === undefined) {
        collapsed = true;
    }
    return (
        <LayersControl position={position} collapsed={collapsed}>
            {basemaps.map(conf => (
                <BasemapToggle
                    key={conf.name}
                    name={conf.name}
                    active={conf.active}
                >
                    <AutoBasemap {...conf} />
                </BasemapToggle>
            ))}
            {overlays.map(conf => (
                <OverlayToggle
                    key={conf.name}
                    name={conf.name}
                    active={conf.active}
                >
                    <AutoOverlay {...conf} context={context} />
                </OverlayToggle>
            ))}
        </LayersControl>
    );
}
MapToolbar.propTypes = {
    overlays: PropTypes.arrayOf(PropTypes.object),
    basemaps: PropTypes.arrayOf(PropTypes.object),
    context: PropTypes.object,
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
