import React, { useState, useEffect } from 'react';
import { useComponents } from '@wq/react';
import { useMapState } from '../hooks';
import PropTypes from 'prop-types';

export default function StickyMap({
    mapId,
    containerStyle,
    invisibleStyle,
    children
}) {
    const state = useMapState(),
        { AutoMap } = useComponents(),
        [stickyState, setStickyState] = useState(null),
        visible = state && mapId && state.mapId === mapId;

    useEffect(() => {
        if (visible) {
            setStickyState(state);
        }
    }, [visible, state]);

    if (!stickyState) {
        return null;
    }

    if (!visible) {
        containerStyle = {
            ...containerStyle,
            position: 'absolute',
            top: '-2000px',
            width: '100vw',
            height: 'calc(100vh - 120px)',
            ...invisibleStyle
        };
    }

    return (
        <AutoMap containerStyle={containerStyle} state={stickyState}>
            {children}
        </AutoMap>
    );
}

StickyMap.propTypes = {
    mapId: PropTypes.string,
    containerStyle: PropTypes.object,
    invisibleStyle: PropTypes.object,
    children: PropTypes.node
};
