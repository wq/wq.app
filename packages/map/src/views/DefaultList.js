import React from 'react';
import { useMapState } from '../hooks';
import { DefaultList, useComponents, useList } from '@wq/react';

export default function DefaultListWithMap() {
    const mapState = useMapState(),
        { AutoMap, StickyMap } = useComponents(),
        context = useList();
    if (mapState) {
        const { mapId } = mapState;
        if (mapId) {
            return (
                <>
                    <DefaultList />
                    <StickyMap mapId={mapId} context={context} />
                </>
            );
        } else {
            return (
                <>
                    <DefaultList />
                    <AutoMap context={context} />
                </>
            );
        }
    } else {
        return <DefaultList />;
    }
}
