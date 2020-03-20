import React from 'react';
import { Button } from 'react-native';
import { useOnPress } from '../hooks';
import PropTypes from 'prop-types';

export default function Link({ to, children }) {
    const onPress = useOnPress(to);
    // FIXME: Use styled text instead?
    return <Button title={children} onPress={onPress} />;
}

Link.propTypes = {
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    children: PropTypes.node
};
