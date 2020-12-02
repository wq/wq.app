import React from 'react';
import MuiListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import PropTypes from 'prop-types';
import { useIcon } from '@wq/react';

export default function ListItem({ children, description, icon, ...rest }) {
    const Icon = useIcon(icon);
    return (
        <MuiListItem {...rest}>
            {Icon && (
                <ListItemIcon>
                    <Icon />
                </ListItemIcon>
            )}
            <ListItemText primary={children} secondary={description} />
        </MuiListItem>
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string
};
