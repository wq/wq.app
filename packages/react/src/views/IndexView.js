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
        { ScrollView, List, ListSubheader, ListItemLink } = useComponents();

    function PageLink({
        route,
        config: {
            icon = null,
            external = false,
            description = null,
            url = "/",
        } = {},
    }) {
        const title = routeTitle(route),
            props = {};
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
    };

    return (
        <ScrollView>
            <List>
                {sections.map(({ name, pages }) => (
                    <>
                        {name && <ListSubheader>{name}</ListSubheader>}
                        {pages.map((page) => (
                            <PageLink
                                key={page.name}
                                route={page.route}
                                config={page}
                            />
                        ))}
                    </>
                ))}
            </List>
        </ScrollView>
    );
}

Index.propTypes = {
    onNavigate: PropTypes.func,
};
