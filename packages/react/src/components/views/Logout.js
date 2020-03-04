import React from 'react';
import { useRenderContext } from '../../hooks';

export default function Logout() {
    const { is_authenticated } = useRenderContext();
    const message = is_authenticated ? 'Logging out...' : 'Logged out';
    return (
        <div>
            <p>{message}</p>
        </div>
    );
}
