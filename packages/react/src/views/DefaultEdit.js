import React from "react";
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse,
} from "../hooks.js";

export default function DefaultEdit() {
    const reverse = useReverse(),
        context = useRenderContext(),
        { page, variant, page_config, outbox_id } = useRouteInfo(),
        { form } = page_config,
        { ScrollView, AutoForm, DeleteForm } = useComponents();

    let backUrl;
    if (outbox_id || variant === "new") {
        backUrl = reverse(`${page_config.name}_list`);
    } else {
        backUrl = reverse(`${page}_detail`, context.id);
    }

    let submitUrl, method;
    if (context.id) {
        submitUrl = `${page_config.url}/${context.id}`;
        method = "PUT";
    } else {
        submitUrl = `${page_config.url}/`;
        method = "POST";
    }

    return (
        <ScrollView>
            {context.id && page_config.can_delete !== false && (
                <DeleteForm action={submitUrl} />
            )}
            <AutoForm
                action={submitUrl}
                cancel={backUrl}
                method={method}
                backgroundSync={page_config.background_sync}
                outboxId={outbox_id}
                data={context}
                error={outbox_id ? context.error : null}
                form={form}
                modelConf={page_config}
            />
        </ScrollView>
    );
}
