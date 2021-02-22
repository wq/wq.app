import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../hooks';

export default function DefaultDetail() {
    const reverse = useReverse(),
        context = useRenderContext(),
        { page, item_id, page_config } = useRouteInfo(),
        { ScrollView, PropertyTable, Fab } = useComponents(),
        form = page_config.form || [{ name: 'label' }],
        editUrl = reverse(`${page}_edit`, item_id);
    return (
        <>
            <ScrollView>
                <PropertyTable form={form} values={context} />
            </ScrollView>
            {page_config.can_change !== false && (
                <Fab icon="edit" to={editUrl} />
            )}
        </>
    );
}
