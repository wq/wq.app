import React from "react";
import {
    useSitemap,
    useReverse,
    useRouteTitle,
    useRouteInfo,
    useComponents,
} from "../hooks.js";
import PropTypes from "prop-types";

export default function Index({ onNavigate }) {
    const reverse = useReverse(),
        routeTitle = useRouteTitle(),
        { name: currentRoute } = useRouteInfo(),
        sections = useSitemap(),
        { ScrollView, List, ListSubheader, ListItemLink, ExpandableListItem } =
            useComponents();

    function PageLink({
        route,
        config: {
            icon = null,
            external = false,
            description = null,
            url = "/",
        } = {},
        style,
    }) {
        const title = routeTitle(route),
            props = { style };
        if (external) {
            props.component = "a";
            props.href = url;
            props.icon = icon || "external";
        } else {
            props.to = reverse(route);
            props.selected = currentRoute.split("_")[0] === route.split("_")[0];
            props.icon = icon || (route.endsWith("_list") ? "list" : "config");
        }
        if (description) {
            props.description = description;
        }
        if (onNavigate) {
            props.onClick = () => onNavigate(route);
        }
        return <ListItemLink {...props}>{title}</ListItemLink>;
    }
    PageLink.propTypes = {
        route: PropTypes.string,
        config: PropTypes.object,
        style: PropTypes.object,
    };

    return (
        <ScrollView>
            <List>
                {sections.map(({ name, pages }) => (
                    <React.Fragment key={name}>
                        {name && <ListSubheader>{name}</ListSubheader>}
                        {pages.map((page) =>
                            page.isSubsection ? (
                                <ExpandableListItem
                                    key={page.label}
                                    icon={page.icon}
                                >
                                    <>{page.label}</>
                                    {page.pages.map((page) => (
                                        <PageLink
                                            key={page.name}
                                            route={page.route}
                                            config={page}
                                            style={{ paddingLeft: 32 }}
                                        />
                                    ))}
                                </ExpandableListItem>
                            ) : (
                                <PageLink
                                    key={page.name}
                                    route={page.route}
                                    config={page}
                                />
                            )
                        )}
                    </React.Fragment>
                ))}
            </List>
        </ScrollView>
    );
}

Index.propTypes = {
    onNavigate: PropTypes.func,
};
