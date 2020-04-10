import React from 'react';
import { useComponents } from '@wq/react';
import { useOnPress } from '../hooks';
import PropTypes from 'prop-types';

export default function ListItemLink({ to, ...rest }) {
    const { ListItem } = useComponents(),
        onPress = useOnPress(to);
    return <ListItem onPress={onPress} {...rest} />;
}

ListItemLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
};
