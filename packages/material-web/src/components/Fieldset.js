import React from "react";
import Card from "@mui/material/Card";
import Typography from "@mui/material/Typography";
import CardContent from "@mui/material/CardContent";
import PropTypes from "prop-types";

export default function Fieldset({ label, children }) {
    return (
        <Card sx={{ mb: 2 }}>
            <CardContent>
                {label && (
                    <Typography color="textSecondary">{label}</Typography>
                )}
                {children}
            </CardContent>
        </Card>
    );
}

Fieldset.propTypes = {
    label: PropTypes.string,
    children: PropTypes.node,
};
