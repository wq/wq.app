import React from "react";
import { useComponents, useMessages } from "@wq/react";
import { TYPE_MAP } from "../hooks.js";
import PropTypes from "prop-types";

export default function GeoHelp({ value, type }) {
    const drawType = TYPE_MAP[type] || type,
        { Typography, GeoHelpIcon } = useComponents(),
        messageId = `GEO_${drawType.toUpperCase()}_${value ? "EDIT" : "NEW"}`,
        { [messageId]: messageTemplate } = useMessages(),
        message = [];

    if (messageTemplate) {
        messageTemplate.split("{").forEach((part) => {
            if (message.length === 0) {
                message.push(part);
                return;
            }
            const [iconName, ...rest] = part.split("}");

            message.push(<GeoHelpIcon name={iconName} type={drawType} />);
            message.push(rest.join("}"));
        });
    }
    return (
        <Typography
            color="textSecondary"
            style={{ flex: 1, textAlign: "right" }}
        >
            {message}
        </Typography>
    );
}

GeoHelp.toolLabel = false;
GeoHelp.toolDefault = true;

GeoHelp.propTypes = {
    value: PropTypes.object,
    type: PropTypes.string,
};
