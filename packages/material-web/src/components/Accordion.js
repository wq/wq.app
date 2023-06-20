import React from "react";
import {
    Accordion as MuiAccordion,
    AccordionSummary,
    AccordionDetails,
} from "@mui/material";
import { useIcon } from "@wq/react";
import PropTypes from "prop-types";

export default function Accordion({
    summary,
    children,
    open,
    onToggle,
    ...rest
}) {
    const ExpandMoreIcon = useIcon("expand") || (() => "V");
    let handleToggle;
    if (onToggle) {
        handleToggle = (evt, state) => onToggle(state);
    }
    return (
        <MuiAccordion expanded={open} onChange={handleToggle} {...rest}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                {summary}
            </AccordionSummary>
            <AccordionDetails>
                <div style={{ flex: 1 }}>{children}</div>
            </AccordionDetails>
        </MuiAccordion>
    );
}

Accordion.propTypes = {
    summary: PropTypes.node,
    children: PropTypes.node,
    open: PropTypes.bool,
    onToggle: PropTypes.func,
};
