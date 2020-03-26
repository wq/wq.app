import React from 'react';
import { List } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function ListItem({ children, ...rest }) {
    return <List.Item title={children} {...rest} />;
}

ListItem.propTypes = {
    children: PropTypes.node
};
