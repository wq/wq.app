import React from 'react';
import PropTypes from 'prop-types';
import Link from 'redux-first-router-link';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

export default function ListItemLink({ children, ...rest }) {
    return (
        <ListItem button component={Link} {...rest}>
            <ListItemText>{children}</ListItemText>
        </ListItem>
    );
}

ListItemLink.propTypes = {
    children: PropTypes.node
};
