import React from 'react';
import { useRenderContext, useReverse, useComponents } from '../../hooks';

const SUCCESS = '\u2713',
    ERROR = '\u2717',
    PENDING = '?';

export default function OutboxList() {
    const reverse = useReverse(),
        { list } = useRenderContext(),
        { List, ListItem, ListItemLink } = useComponents();

    const empty = !list || !list.length;

    return (
        <List>
            {empty && <ListItem>No items in outbox.</ListItem>}
            {(list || []).map(item => (
                <ListItemLink
                    key={item.id}
                    to={reverse('outbox_detail', item.id)}
                >
                    {item.synced ? SUCCESS : item.error ? ERROR : PENDING}
                    {item.modelConf && `${item.modelConf.name}: `}
                    {item.label}
                </ListItemLink>
            ))}
        </List>
    );
}
