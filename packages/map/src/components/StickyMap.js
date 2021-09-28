import React, { useEffect } from 'react';
import { useComponents, usePluginReducer } from '@wq/react';
import PropTypes from 'prop-types';
import { Reparentable, moveOffscreen } from './OffscreenMaps';

export default function StickyMap({ mapId, name, containerStyle, children }) {
    const [mapState, { setStickyProps }] = usePluginReducer('map'),
        { stickyMapId, stickyMaps } = mapState,
        currentProps =
            stickyMaps && stickyMaps[mapId] && stickyMaps[mapId].props,
        { AutoMap } = useComponents();

    useEffect(() => {
        if (mapState.mapId !== mapId) {
            return;
        }

        const nextState = {};
        Object.keys(mapState).forEach(key => {
            if (key === 'stickyMapId' || key === 'stickyMaps') {
                return;
            }
            nextState[key] = mapState[key];
        });

        if (
            currentProps &&
            currentProps.name === name &&
            currentProps.containerStyle === containerStyle &&
            Object.keys(nextState).every(
                key => nextState[key] === currentProps.state[key]
            )
        ) {
            return;
        }

        setStickyProps({
            name,
            containerStyle,
            state: nextState,
            children
        });
    }, [mapId, mapState, currentProps, name, containerStyle, children]);

    useEffect(() => {
        return () => {
            moveOffscreen(mapId);
        };
    }, [mapId]);

    return (
        <Reparentable id={mapId}>
            {mapId === stickyMapId && <AutoMap key={mapId} {...currentProps} />}
        </Reparentable>
    );
}

StickyMap.propTypes = {
    mapId: PropTypes.string,
    name: PropTypes.string,
    containerStyle: PropTypes.object,
    children: PropTypes.node
};
