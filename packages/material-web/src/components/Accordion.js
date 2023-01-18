import React from "react";
import MuiAccordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import PropTypes from "prop-types";

export default function Accordion({
    summary,
    children,
    open,
    onToggle,
    ...rest
}) {
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
