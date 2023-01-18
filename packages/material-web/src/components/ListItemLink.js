import React from "react";
import { useComponents, Link } from "@wq/react";

export default function ListItemLink(props) {
    const { ListItem } = useComponents();
    return <ListItem button component={Link} {...props} />;
}
