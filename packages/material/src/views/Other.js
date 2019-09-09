import React from 'react';
import { useRenderContext, useRouteInfo } from '../hooks';

export default function Other() {
    const context = useRenderContext(),
        { name } = useRouteInfo();
    return (
        <>
            <p>
                To customize this view, define <code>components.{name}</code> in
                your @wq/material config.
            </p>
            <pre>
                <code>{JSON.stringify(context, null, 4)}</code>
            </pre>
        </>
    );
}
