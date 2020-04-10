import React from 'react';
import {
    useRenderContext,
    useRouteInfo,
    useComponents,
    useViewComponents,
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
        } = useComponents(),
        { OutboxList } = useViewComponents();

    const empty = !list || !list.length,
        unsynced = (unsyncedItems && unsyncedItems.length) || false;

    return (
        <>
            <ScrollView>
                {unsynced && <OutboxList embedded />}
                <List>
                    {unsynced && <ListSubheader>Synced Items</ListSubheader>}
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
            <Fab icon="add" to={reverse(`${page}_edit:new`)} />
        </>
    );
}
