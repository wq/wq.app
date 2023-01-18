import React from "react";
import { useNav, useComponents } from "@wq/react";
import PropTypes from "prop-types";

export default function ListItemLink({ to, ...rest }) {
    const { ListItem } = useComponents(),
        onPress = useNav(to);
    return <ListItem onPress={onPress} {...rest} />;
}

ListItemLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
