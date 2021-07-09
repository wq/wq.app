import React from 'react';
import { useMapState } from '../hooks';
import { DefaultDetail, useComponents } from '@wq/react';

export default function DefaultDetailWithMap() {
    const mapState = useMapState(),
        { AutoMap, StickyMap } = useComponents();
    if (mapState) {
        const { mapId } = mapState;
        if (mapId) {
            return (
                <>
                    <DefaultDetail />
                    <StickyMap mapId={mapId} />
                </>
            );
        } else {
            return (
                <>
                    <DefaultDetail />
                    <AutoMap />
                </>
            );
        }
    } else {
        return <DefaultDetail />;
    }
}
