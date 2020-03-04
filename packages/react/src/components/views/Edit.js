import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../../hooks';

export default function Edit() {
    const reverse = useReverse(),
        context = useRenderContext(),
        { page, variant, page_config, outbox_id } = useRouteInfo(),
        { form } = page_config,
        { AutoForm } = useComponents();

    let backUrl, submitUrl, method;

    if (variant === 'new') {
        backUrl = reverse(`${page}_list`);
        submitUrl = `${page_config.url}/`;
        method = 'POST';
    } else {
        backUrl = reverse(`${page}_detail`, context.id);
        submitUrl = `${page_config.url}/${context.id}`;
        method = 'PUT';
    }

    return (
        <AutoForm
            action={submitUrl}
            cancel={backUrl}
            method={method}
            outboxId={outbox_id}
            data={context}
            form={form}
        />
    );
}
