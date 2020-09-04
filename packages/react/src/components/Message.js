import React from 'react';
import { useMessages } from '../hooks';
import PropTypes from 'prop-types';

export default function Message({ id }) {
    const messages = useMessages(),
        message = messages[id] || id;
    return <>{message}</>;
}

Message.propTypes = {
    id: PropTypes.string
};
