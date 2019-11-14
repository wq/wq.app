import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../hooks';

export default function List() {
    const reverse = useReverse(),
        { list } = useRenderContext(),
        { page } = useRouteInfo(),
        { Link } = useComponents();

    return (
        <>
            <p>
                No view components registered. You may want to import and use
                @wq/material as well.
            </p>
            <ul>
                {list.map(row => (
                    <li key={row.id}>
                        <Link to={reverse(`${page}_detail`, row.id)}>
                            {row.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </>
    );
}
