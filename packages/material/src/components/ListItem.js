import React from 'react';
import MuiListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import PropTypes from 'prop-types';

export default function ListItem({ children, description, ...rest }) {
    return (
        <MuiListItem {...rest}>
            <ListItemText primary={children} secondary={description} />
        </MuiListItem>
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node
};
