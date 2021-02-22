import React from 'react';
import { useRenderContext } from '../hooks';

const HTML = '@@HTML';

export default function Server() {
    const html = useRenderContext()[HTML];
    return (
        <>
            <p>This renderer does not (yet) support server-rendered HTML.</p>
            <pre>
                <code>{html}</code>
            </pre>
        </>
    );
}
