import React from "react";
import {
    ListItem as MuiListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
} from "@mui/material";
import PropTypes from "prop-types";
import { useIcon } from "@wq/react";

export default function ListItem({
    children,
    description,
    icon,
    secondaryAction,
    ...rest
}) {
    const Icon = useIcon(icon);
    return (
        <MuiListItem {...rest}>
            {Icon && (
                <ListItemIcon>
                    <Icon />
                </ListItemIcon>
            )}
            <ListItemText primary={children} secondary={description} />
            {secondaryAction && (
                <ListItemSecondaryAction>
                    {secondaryAction}
                </ListItemSecondaryAction>
            )}
        </MuiListItem>
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string,
    secondaryAction: PropTypes.node,
};
