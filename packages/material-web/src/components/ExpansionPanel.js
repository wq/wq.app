import React from 'react';
import MuiExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';

export default function ExpansionPanel({ summary, children, open, onToggle }) {
    let handleToggle;
    if (onToggle) {
        handleToggle = (evt, state) => onToggle(state);
    }
    return (
        <MuiExpansionPanel expanded={open} onChange={handleToggle}>
            <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                {summary}
            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
                <div style={{ flex: 1 }}>{children}</div>
            </ExpansionPanelDetails>
        </MuiExpansionPanel>
    );
}

ExpansionPanel.propTypes = {
    summary: PropTypes.node,
    children: PropTypes.node,
    open: PropTypes.bool,
    onToggle: PropTypes.func
};
