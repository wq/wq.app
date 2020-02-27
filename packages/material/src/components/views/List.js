import React from 'react';
import MuiList from '@material-ui/core/List';
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
            <MuiList>
                {list.map(row => (
                    <ListItemLink
                        key={row.id}
                        to={reverse(`${page}_detail`, row.id)}
                    >
                        {row.label}
                    </ListItemLink>
                ))}
            </MuiList>
            <Pagination />
        </div>
    );
}
