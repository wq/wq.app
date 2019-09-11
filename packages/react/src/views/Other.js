import React from 'react';
import { useRouteInfo, usePluginContent, useComponents } from '../hooks';

export default function Other() {
    const PluginContent = usePluginContent(),
        { name } = useRouteInfo(),
        { DebugContext } = useComponents();

    return PluginContent ? (
        <PluginContent />
    ) : (
        <>
            <p>
                To customize this view, define <code>views.{name}</code> in your
                @wq/react config or a plugin.
            </p>
            <DebugContext />
        </>
    );
}
