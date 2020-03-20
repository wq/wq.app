import React from 'react';
import { Button } from 'react-native-paper';
import { useOnPress } from '../hooks';
import PropTypes from 'prop-types';

export default function ButtonLink({ to, children }) {
    const onPress = useOnPress(to);
    return <Button onPress={onPress}>{children}</Button>;
}

ButtonLink.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    children: PropTypes.node
};
