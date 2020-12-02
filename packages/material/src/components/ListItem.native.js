import React from 'react';
import { useIcon } from '@wq/react';
import { List } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function ListItem({ children, description, icon, ...rest }) {
    const Icon = useIcon(icon);
    return (
        <List.Item
            title={children}
            description={description}
            left={Icon ? props => <List.Icon icon={Icon} {...props} /> : null}
            {...rest}
        />
    );
}

ListItem.propTypes = {
    children: PropTypes.node,
    description: PropTypes.node,
    icon: PropTypes.string
};
