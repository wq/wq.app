import React from "react";
import { Chip as MuiChip } from "@mui/material";
import { useIcon } from "@wq/react";
import PropTypes from "prop-types";

export default function Chip({ icon, ...rest }) {
    const Icon = useIcon(icon);
    return <MuiChip icon={Icon ? <Icon /> : null} {...rest} />;
}

Chip.propTypes = {
    icon: PropTypes.string,
};
