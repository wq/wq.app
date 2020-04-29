import React from 'react';
import {
    useApp,
    useRenderContext,
    useReverse,
    useRouteTitle,
    useComponents
} from '../../hooks';
import PropTypes from 'prop-types';

export default function OutboxList({ embedded }) {
    const app = useApp(),
        reverse = useReverse(),
        routeTitle = useRouteTitle(),
        { list, unsyncedItems } = useRenderContext(),
        {
            List,
            ListItem,
            ListItemLink,
            ListSubheader,
            ScrollView,
            HorizontalView,
            Button
        } = useComponents();

    const items = embedded ? unsyncedItems : list,
        empty = !items || !items.length;

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
        if (item.options.modelConf && !embedded) {
            const pageName = routeTitle(
                `${item.options.modelConf.name}_detail`
            );
            return `${pageName}: ${item.label}`;
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

    function OutboxItems() {
        return (
            <>
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
            </>
        );
    }

    if (embedded) {
        return (
            <List>
                <ListSubheader>Unsynced Items</ListSubheader>
                <OutboxItems />
            </List>
        );
    } else {
        return (
            <>
                <ScrollView>
                    <List>
                        <OutboxItems />
                    </List>
                </ScrollView>
                {!empty && (
                    <HorizontalView>
                        <Button onClick={() => app.emptyOutbox(true)}>
                            Empty Outbox
                        </Button>
                        <Button onClick={() => app.retryAll()}>
                            Retry All
                        </Button>
                    </HorizontalView>
                )}
            </>
        );
    }
}

OutboxList.propTypes = {
    embedded: PropTypes.bool
};
