import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../../hooks';

export default function DefaultEdit() {
    const reverse = useReverse(),
        context = useRenderContext(),
        { page, variant, page_config, outbox_id } = useRouteInfo(),
        { form } = page_config,
        { ScrollView, AutoForm } = useComponents();

    let backUrl;
    if (outbox_id || variant === 'new') {
        backUrl = reverse(`${page_config.name}_list`);
    } else {
        backUrl = reverse(`${page}_detail`, context.id);
    }

    let submitUrl, method;
    if (context.id) {
        submitUrl = `${page_config.url}/${context.id}`;
        method = 'PUT';
    } else {
        submitUrl = `${page_config.url}/`;
        method = 'POST';
    }

    return (
        <ScrollView>
            <AutoForm
                action={submitUrl}
                cancel={backUrl}
                method={method}
                outboxId={outbox_id}
                data={context}
                error={outbox_id ? context.error : null}
                form={form}
            />
        </ScrollView>
    );
}
