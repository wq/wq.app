import React from 'react';
import { List } from 'react-native-paper';
import PropTypes from 'prop-types';

export default function ExpansionPanel({ summary, children, open, onToggle }) {
    let handleToggle;
    if (onToggle) {
        handleToggle = () => onToggle(!open);
    }
    return (
        <List.Accordion title={summary} expanded={open} onPress={handleToggle}>
            {children}
        </List.Accordion>
    );
}

ExpansionPanel.propTypes = {
    summary: PropTypes.node,
    children: PropTypes.node,
    open: PropTypes.bool,
    onToggle: PropTypes.func
};
