import React from "react";
import { Text, ScrollView } from "react-native";
import PropTypes from "prop-types";

export default function FormatJson({ json }) {
    return (
        <ScrollView style={{ height: 128 }}>
            <Text>{JSON.stringify(json, null, 4)}</Text>
        </ScrollView>
    );
}

FormatJson.propTypes = {
    json: PropTypes.object,
};
