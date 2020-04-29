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
        { page, page_config } = useRouteInfo(),
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

    function Row({ id, label }) {
        if (page_config.can_view === false) {
            return <ListItem>{label}</ListItem>;
        } else {
            return (
                <ListItemLink to={reverse(`${page}_detail`, id)}>
                    {label}
                </ListItemLink>
            );
        }
    }

    return (
        <>
            <ScrollView>
                {unsynced && <OutboxList embedded />}
                <List>
                    {unsynced && <ListSubheader>Synced Items</ListSubheader>}
                    {empty && <ListItem>Empty list.</ListItem>}
                    {(list || []).map(row => (
                        <Row key={row.id} {...row} />
                    ))}
                </List>
                <Pagination />
            </ScrollView>
            {page_config.can_add && (
                <Fab icon="add" to={reverse(`${page}_edit:new`)} />
            )}
        </>
    );
}
