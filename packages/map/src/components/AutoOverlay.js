import React from 'react';
import PropTypes from 'prop-types';
import { useOverlayComponents } from '../hooks';

export default function AutoOverlay({ type, ...conf }) {
    const overlays = useOverlayComponents(),
        Overlay = overlays[type];

    if (type === 'empty') {
        return Overlay ? <Overlay /> : null;
    } else if (type === 'group') {
        const Group = Overlay || React.Fragment;
        return (
            <Group>
                {conf.layers.map(layer => (
                    <AutoOverlay key={layer.name} {...layer} />
                ))}
            </Group>
        );
    } else if (!Overlay) {
        console.warn(`Skipping unrecognized layer type "${type}"`);
        return null;
    }

    return <Overlay {...conf} />;
}
AutoOverlay.propTypes = {
    type: PropTypes.string.isRequired
};
