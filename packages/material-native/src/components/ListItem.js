import React from "react";
import { useIcon } from "@wq/react";
import { List } from "react-native-paper";
import PropTypes from "prop-types";

export default function ListItem({
    children,
    description,
    icon,
    dense,
    style,
    onClick,
    ...rest
}) {
    const Icon = useIcon(icon);
    return (
        <List.Item
            title={children}
            description={description}
            left={Icon ? (props) => <List.Icon icon={Icon} {...props} /> : null}
            onPress={onClick}
            style={{
                ...(dense && { paddingTop: 4, paddingBottom: 4 }),
                ...style,
            }}
            {...rest}
        />
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string,
    dense: PropTypes.bool,
    style: PropTypes.object,
    onClick: PropTypes.func,
};
