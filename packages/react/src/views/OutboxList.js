import React from "react";
import {
    useApp,
    useReverse,
    useRouteTitle,
    useComponents,
    useOutbox,
} from "../hooks.js";
import PropTypes from "prop-types";

export default function OutboxList({ modelConf }) {
    const app = useApp(),
        reverse = useReverse(),
        routeTitle = useRouteTitle(),
        allItems = useOutbox(),
        items = modelConf
            ? app.outbox.filterUnsynced(allItems, modelConf)
            : allItems,
        {
            Message,
            List,
            ListItem,
            ListItemLink,
            ListSubheader,
            View,
            ScrollView,
            HorizontalView,
            Button,
        } = useComponents();

    const empty = !items.length;

    function getLink(item) {
        if (item.synced) {
            // TODO: Link to model detail or edit page?
            return null;
        } else {
            return reverse("outbox_edit", item.id);
        }
    }

    function getIcon(item) {
        if (item.synced) {
            return "success";
        } else if (item.error) {
            return "error";
        } else {
            return "pending";
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
            return "SYNC_SUCCESS";
        } else if (item.error) {
            if (typeof item.error === "string") {
                return item.error;
            } else {
                return "SYNC_ERROR";
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
                {items.map((item) => {
                    const link = getLink(item),
                        ListItemOrLink = link ? ListItemLink : ListItem;
                    return (
                        <ListItemOrLink
                            key={item.id}
                            to={link}
                            icon={getIcon(item)}
                            description={<Message id={getStatus(item)} />}
                        >
                            {getTitle(item)}
                        </ListItemOrLink>
                    );
                })}
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
            <View style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
            </View>
        );
    }
}

OutboxList.propTypes = {
    modelConf: PropTypes.object,
};
