import React from 'react';
import { useComponents, usePluginContent } from '../hooks';

export default function Placeholder() {
    const PluginContent = usePluginContent(),
        { DebugContext } = useComponents();
    return (
        <>
            <p>
                No view components registered. You may want to import and use
                @wq/material as well.
            </p>
            {PluginContent && <PluginContent />}
            <DebugContext />
        </>
    );
}
