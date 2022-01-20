import React from 'react';
import { useMapState } from '../hooks';
import { DefaultDetail, useComponents, useRenderContext } from '@wq/react';

export default function DefaultDetailWithMap() {
    const mapState = useMapState(),
        { AutoMap, StickyMap } = useComponents(),
        context = useRenderContext();
    if (mapState) {
        const { mapId } = mapState;
        if (mapId) {
            return (
                <>
                    <DefaultDetail />
                    <StickyMap mapId={mapId} context={context} />
                </>
            );
        } else {
            return (
                <>
                    <DefaultDetail />
                    <AutoMap context={context} />
                </>
            );
        }
    } else {
        return <DefaultDetail />;
    }
}
