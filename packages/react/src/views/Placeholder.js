import React from 'react';
import { useComponents } from '../hooks';

export default function Placeholder() {
    const { DebugContext } = useComponents();
    return (
        <div>
            <p>
                No view components registered. You may want to import and use
                @wq/material as well.
            </p>
            <DebugContext />
        </div>
    );
}
