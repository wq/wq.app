import React from 'react';
import PropTypes from 'prop-types';
import { useOverlayComponents } from '../hooks';

export default function AutoOverlay({ type, ...conf }) {
    const overlays = useOverlayComponents();
    const Overlay = overlays[type];
    if (!Overlay) {
        console.warn(`Skipping unrecognized layer type "${type}"`);
        return null;
    }
    return <Overlay {...conf} />;
}
AutoOverlay.propTypes = {
    type: PropTypes.string.isRequired
};
