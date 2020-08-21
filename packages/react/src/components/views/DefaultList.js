import React from 'react';
import {
    useComponents,
    useViewComponents,
    useReverse,
    useList
} from '../../hooks';

export default function DefaultList() {
    const reverse = useReverse(),
        { list, unsynced, empty, page_config } = useList(),
        {
            ScrollView,
            List,
            ListSubheader,
            ListItem,
            ListItemLink,
            Pagination,
            Fab
        } = useComponents(),
        { OutboxList } = useViewComponents(),
        { page, can_add, can_view } = page_config,
        hasUnsynced = unsynced.length > 0;

    function Row({ id, label }) {
        if (can_view === false) {
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
                {hasUnsynced && <OutboxList modelConf={page_config} />}
                <List>
                    {hasUnsynced && <ListSubheader>Synced Items</ListSubheader>}
                    {empty && <ListItem>Empty list.</ListItem>}
                    {(list || []).map(row => (
                        <Row key={row.id} {...row} />
                    ))}
                </List>
                <Pagination />
            </ScrollView>
            {can_add && <Fab icon="add" to={reverse(`${page}_edit:new`)} />}
        </>
    );
}
