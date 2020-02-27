import React from 'react';
import { useComponents, useRouteInfo, useReverse } from '../../hooks';

export default function Detail() {
    const reverse = useReverse(),
        { page, item_id } = useRouteInfo(),
        editUrl = reverse(`${page}_edit`, item_id);
    const { Link, DebugContext } = useComponents();
    return (
        <div>
            <Link to={editUrl}>Edit</Link>
            <p>
                No view components registered. You may want to import and use
                @wq/material as well.
            </p>
            <DebugContext />
        </div>
    );
}
