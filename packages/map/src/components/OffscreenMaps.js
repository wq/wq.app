import React, { useEffect } from 'react';
import { useComponents, usePluginReducer } from '@wq/react';
import { createReparentableSpace } from 'react-reparenting';

const { Reparentable, sendReparentableChild } = createReparentableSpace();

export { Reparentable };

const OFFSCREEN_ID = 'offscreen-maps',
    INVISIBLE_STYLE = {
        position: 'absolute',
        top: '-2000px',
        width: '100vw',
        height: 'calc(100vh - 120px)'
    };

export function moveOffscreen(mapId) {
    sendReparentableChild(mapId, OFFSCREEN_ID, mapId, 0);
}

export default function OffscreenMaps() {
    const { AutoMap } = useComponents();
    const [
        { mapId, stickyMaps, stickyMapId },
        { setStickyMapId }
    ] = usePluginReducer('map');

    useEffect(() => {
        if ((!mapId && !stickyMapId) || mapId === stickyMapId) {
            return;
        }

        if (stickyMapId) {
            moveOffscreen(stickyMapId);
        }

        if (
            mapId &&
            stickyMaps &&
            stickyMaps[mapId] &&
            stickyMaps[mapId].props
        ) {
            sendReparentableChild(OFFSCREEN_ID, mapId, mapId, 0);
            setStickyMapId(mapId);
        } else {
            setStickyMapId(null);
        }
    }, [mapId, stickyMapId, stickyMaps]);

    return (
        <div style={INVISIBLE_STYLE}>
            <Reparentable id={OFFSCREEN_ID}>
                {Object.entries(stickyMaps || {}).map(
                    ([
                        mapId,
                        {
                            props: {
                                name,
                                containerStyle,
                                invisibleStyle,
                                state
                            } = {}
                        }
                    ]) =>
                        mapId !== stickyMapId &&
                        state && (
                            <AutoMap
                                key={mapId}
                                name={name}
                                state={state}
                                containerStyle={{
                                    ...containerStyle,
                                    ...INVISIBLE_STYLE,
                                    ...invisibleStyle
                                }}
                            />
                        )
                )}
            </Reparentable>
        </div>
    );
}