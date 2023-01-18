import React from "react";
import { Appbar } from "react-native-paper";
import { useBreadcrumbs, useNav } from "@wq/react";
import PropTypes from "prop-types";

export default function Header({ options, route }) {
    const title = options.title || route.name,
        breadcrumbs = useBreadcrumbs() || [],
        previous = breadcrumbs[breadcrumbs.length - 2],
        nav = useNav(previous?.url);
    return (
        <Appbar.Header>
            {previous && <Appbar.BackAction onPress={nav} />}
            <Appbar.Content title={title} />
        </Appbar.Header>
    );
}

Header.propTypes = {
    options: PropTypes.object,
    route: PropTypes.object,
};
