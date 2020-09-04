import React from 'react';
import {
    useApp,
    useReverse,
    useRouteTitle,
    useComponents,
    useUnsynced
} from '../../hooks';
import PropTypes from 'prop-types';

export default function OutboxList({ modelConf }) {
    const app = useApp(),
        reverse = useReverse(),
        routeTitle = useRouteTitle(),
        items = useUnsynced(modelConf),
        {
            Message,
            List,
            ListItem,
            ListItemLink,
            ListSubheader,
            ScrollView,
            HorizontalView,
            Button
        } = useComponents();

    const empty = !items.length;

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
        if (item.options.modelConf && !modelConf) {
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
            return 'SYNC_SUCCESS';
        } else if (item.error) {
            if (typeof item.error === 'string') {
                return item.error;
            } else {
                return 'SYNC_ERROR';
            }
        } else {
            return null;
        }
    }

    function OutboxItems() {
        return (
            <>
                {empty && (
                    <ListItem>
                        <Message id="OUTBOX_IS_EMPTY" />
                    </ListItem>
                )}
                {items.map(item => (
                    <ListItemLink
                        key={item.id}
                        to={reverse('outbox_edit', item.id)}
                        icon={getIcon(item)}
                        description={<Message id={getStatus(item)} />}
                    >
                        {getTitle(item)}
                    </ListItemLink>
                ))}
            </>
        );
    }

    if (modelConf) {
        return (
            <List>
                <ListSubheader>
                    <Message id="UNSYNCED_ITEMS" />
                </ListSubheader>
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
                            <Message id="EMPTY_OUTBOX" />
                        </Button>
                        <Button onClick={() => app.retryAll()}>
                            <Message id="RETRY_ALL" />
                        </Button>
                    </HorizontalView>
                )}
            </>
        );
    }
}

OutboxList.propTypes = {
    modelConf: PropTypes.object
};
