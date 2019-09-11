import React from 'react';
import UIList from '@material-ui/core/List';
import Grid from '@material-ui/core/Grid';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse,
    usePluginContent
} from '@wq/react';

function LinkList() {
    const reverse = useReverse(),
        { list } = useRenderContext(),
        { page } = useRouteInfo(),
        { ListItemLink } = useComponents();

    return (
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
    );
}

export default function List() {
    const PluginContent = usePluginContent(),
        { Pagination } = useComponents();

    return PluginContent ? (
        <>
            <Grid container>
                <Grid item xs={6}>
                    <LinkList />
                </Grid>
                <Grid item xs={6}>
                    <PluginContent />
                </Grid>
            </Grid>
            <Pagination />
        </>
    ) : (
        <>
            <LinkList />
            <Pagination />
        </>
    );
}
