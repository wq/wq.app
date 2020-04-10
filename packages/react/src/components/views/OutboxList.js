import React from 'react';
import { useRenderContext, useReverse, useComponents } from '../../hooks';
import PropTypes from 'prop-types';

export default function OutboxList({ embedded }) {
    const reverse = useReverse(),
        { list, unsyncedItems } = useRenderContext(),
        { List, ListItem, ListItemLink } = useComponents();

    const items = embedded ? unsyncedItems : list,
        empty = !list || !list.length;

    function getIcon(item) {
        if (item.synced) {
            return 'success';
        } else if (item.error) {
            return 'error';
        } else {
            return 'pending';
        }
    }

    function getTitle(item) {
        if (item.modelConf && !embedded) {
            return `${item.modelConf.name}: {item.label}`;
        } else {
            return item.label;
        }
    }

    function getStatus(item) {
        if (item.synced) {
            return 'Successfully synced.';
        } else if (item.error) {
            if (typeof item.error === 'string') {
                return item.error;
            } else {
                return 'One or more errors found.';
            }
        } else {
            return null;
        }
    }

    return (
        <List>
            {empty && <ListItem>No items in outbox.</ListItem>}
            {(items || []).map(item => (
                <ListItemLink
                    key={item.id}
                    to={reverse('outbox_edit', item.id)}
                    icon={getIcon(item)}
                    description={getStatus(item)}
                >
                    {getTitle(item)}
                </ListItemLink>
            ))}
        </List>
    );
}

OutboxList.propTypes = {
    embedded: PropTypes.bool
};
