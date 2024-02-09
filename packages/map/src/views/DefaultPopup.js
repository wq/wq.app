import React from "react";
import { useComponents, useConfig } from "@wq/react";
import { useFeatureValues, useFeatureUrl } from "../hooks.js";
import PropTypes from "prop-types";

export default function DefaultPopup({ feature, sx }) {
    const config = useConfig(),
        modelConf = feature.popup ? config.pages[feature.popup] : null,
        { PropertyTable } = useComponents();

    if (modelConf) {
        return (
            <ModelFeaturePopup
                feature={feature}
                modelConf={modelConf}
                sx={sx}
            />
        );
    } else {
        const form = Object.keys(feature.properties).map((name) => ({
            name,
        }));
        return (
            <FeaturePopup style={sx}>
                <PropertyTable form={form} values={feature.properties} />
            </FeaturePopup>
        );
    }
}

function ModelFeaturePopup({ feature, modelConf, sx }) {
    const values = useFeatureValues(feature, modelConf),
        editUrl = useFeatureUrl(feature, modelConf, "edit"),
        { PropertyTable } = useComponents();
    return (
        <FeaturePopup actionIcon="edit" actionUrl={editUrl} sx={sx}>
            <PropertyTable form={modelConf.form} values={values} />
        </FeaturePopup>
    );
}

export function FeaturePopup({ children, actionIcon = "edit", actionUrl, sx }) {
    const { View, Fab } = useComponents();
    return (
        <View
            sx={{
                maxWidth: "70em",
                position: "relative",
                marginLeft: "auto",
                marginRight: "auto",
                ...sx,
            }}
        >
            {children}
            {actionUrl && <Fab icon={actionIcon} to={actionUrl} />}
        </View>
    );
}

DefaultPopup.propTypes = {
    feature: PropTypes.object,
    sx: PropTypes.object,
};
