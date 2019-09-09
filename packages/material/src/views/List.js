import React from 'react';
import UIList from '@material-ui/core/List';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../hooks';

export default function List() {
    const { list } = useRenderContext(),
        { page } = useRouteInfo(),
        { ListItemLink, Pagination } = useComponents(),
        reverse = useReverse();

    return (
        <>
            <UIList>
                {list.map(row => (
                    <ListItemLink
                        key={row.id}
                        to={reverse(`${page}_detail`, row.id)}
                    >
                        {row.label}
                    </ListItemLink>
                ))}
            </UIList>
            <Pagination />
        </>
    );
}
