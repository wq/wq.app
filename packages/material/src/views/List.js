import React from 'react';
import UIList from '@material-ui/core/List';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '@wq/react';

export default function List() {
    const reverse = useReverse(),
        { list } = useRenderContext(),
        { page } = useRouteInfo(),
        { ListItemLink, Pagination } = useComponents();

    return (
        <div>
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
        </div>
    );
}
