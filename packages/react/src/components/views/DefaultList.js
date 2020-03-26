import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useReverse
} from '../../hooks';

export default function DefaultList() {
    const reverse = useReverse(),
        { list, unsyncedItems } = useRenderContext(),
        { page } = useRouteInfo(),
        {
            ScrollView,
            List,
            ListSubheader,
            ListItem,
            ListItemLink,
            Pagination,
            Fab
        } = useComponents();

    const empty = !list || !list.length,
        unsynced = (unsyncedItems && unsyncedItems.length) || false;

    return (
        <>
            <ScrollView>
                <List>
                    {unsynced && (
                        <>
                            <ListSubheader>Unsynced Items</ListSubheader>
                            {unsyncedItems.map(row => (
                                <ListItemLink
                                    key={row.id}
                                    to={reverse('outbox_edit', row.id)}
                                >
                                    {row.label}
                                </ListItemLink>
                            ))}
                            <ListSubheader>Synced Items</ListSubheader>
                        </>
                    )}
                    {empty && <ListItem>Empty list.</ListItem>}
                    {(list || []).map(row => (
                        <ListItemLink
                            key={row.id}
                            to={reverse(`${page}_detail`, row.id)}
                        >
                            {row.label}
                        </ListItemLink>
                    ))}
                </List>
                <Pagination />
            </ScrollView>
            <Fab type="add" to={reverse(`${page}_edit:new`)} />
        </>
    );
}
