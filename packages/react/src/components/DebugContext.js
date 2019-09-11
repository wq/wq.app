import React from 'react';
import PropTypes from 'prop-types';
import { useRenderContext, useRouteInfo } from '../hooks';

const SKIP = [
    'app_config',
    'wq_config',
    'router_info',
    'rt',
    'svc',
    'user',
    'is_authenticated',
    'csrf_token',
    'native',
    'unsynced',
    'local',
    '_refreshCount'
];

const Format = ({ json }) => (
    <pre>
        <code>{JSON.stringify(json, null, 4)}</code>
    </pre>
);
Format.propTypes = {
    json: PropTypes.object
};

export default function DebugContext() {
    const context = useRenderContext(),
        routeInfo = useRouteInfo();
    const main = { ...context },
        other = {};
    SKIP.forEach(skip => {
        other[skip] = main[skip];
        delete main[skip];
    });
    return (
        <>
            <h3>Context</h3>
            <Format json={main} />
            <h3>Route Info</h3>
            <Format json={routeInfo} />
            <h3>Additonal Context</h3>
            <Format json={other} />
        </>
    );
}
