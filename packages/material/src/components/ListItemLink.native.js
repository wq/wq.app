import React from 'react';
import { List } from 'react-native-paper';
import { useOnPress } from '../hooks';
import PropTypes from 'prop-types';

export default function ListItemLink({ to, children, ...rest }) {
    const onPress = useOnPress(to);
    return <List.Item onPress={onPress} title={children} {...rest} />;
}

ListItemLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    children: PropTypes.node
};
