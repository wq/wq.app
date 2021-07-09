import React from 'react';
import { useMapState } from '../hooks';
import { DefaultList, useComponents } from '@wq/react';

export default function DefaultListWithMap() {
    const mapState = useMapState(),
        { AutoMap, StickyMap } = useComponents();
    if (mapState) {
        const { mapId } = mapState;
        if (mapId) {
            return (
                <>
                    <DefaultList />
                    <StickyMap mapId={mapId} />
                </>
            );
        } else {
            return (
                <>
                    <DefaultList />
                    <AutoMap />
                </>
            );
        }
    } else {
        return <DefaultList />;
    }
}
