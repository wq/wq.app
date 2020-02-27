import React from 'react';
import { useRouteInfo, useComponents } from '../../hooks';

export default function Other() {
    const { name } = useRouteInfo(),
        { DebugContext } = useComponents();

    return (
        <div>
            <p>
                To customize this view, define <code>views.{name}</code> in your
                @wq/react config or a plugin.
            </p>
            <DebugContext />
        </div>
    );
}
