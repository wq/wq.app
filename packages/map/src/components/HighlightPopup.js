import React from "react";
import { useComponents, useViewComponents, usePluginReducer } from "@wq/react";
import PropTypes from "prop-types";

export default function HighlightPopup({ inMap }) {
    const { Popup, View, ScrollView, IconButton } = useComponents(),
        [{ highlight }, { clearHighlight }] = usePluginReducer("map"),
        features = (highlight && highlight.features) || [];
    if (inMap) {
        return null;
    }
    return (
        <View style={{ position: "absolute", bottom: 0 }}>
            <Popup
                open={features.length > 0}
                onClose={clearHighlight}
                variant="persistent"
            >
                <IconButton
                    icon="close"
                    onClick={clearHighlight}
                    style={{
                        position: "absolute",
                        right: 0,
                        top: 0,
                        zIndex: 1,
                    }}
                />
                <ScrollView style={{ maxHeight: "33vh" }}>
                    {features.map((feature) => (
                        <HighlightContent key={feature.id} feature={feature} />
                    ))}
                </ScrollView>
            </Popup>
        </View>
    );
}

export function HighlightContent({ feature, inMap }) {
    const popupName = feature.popup
            ? `${feature.popup}-popup`
            : "default-popup",
        views = useViewComponents();

    let View = views[popupName];
    if (!View) {
        console.warn(`No popup view named ${popupName}, using default.`);
        View = views["default-popup"];
        if (!View) {
            throw new Error("No popup view named default-popup!");
        }
    }

    return <View feature={feature} inMap={inMap} />;
}

HighlightContent.propTypes = {
    feature: PropTypes.object,
    inMap: PropTypes.bool,
};
