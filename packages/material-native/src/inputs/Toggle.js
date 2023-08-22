import React from "react";
import { View, Text } from "react-native";
import { ToggleButton, List } from "react-native-paper";
import HelperText from "./HelperText.js";
import { useField } from "formik";
import PropTypes from "prop-types";

export default function Toggle({ name, choices, label, hint, style }) {
    const [, { value }, { setValue }] = useField(name);
    return (
        <View>
            <List.Subheader>{label}</List.Subheader>
            <ToggleButton.Row
                onValueChange={setValue}
                value={value}
                style={{ paddingLeft: 16, paddingBottom: 8, ...style }}
            >
                {choices.map((choice) => (
                    <ToggleButton
                        key={choice.name}
                        value={choice.name}
                        icon={() => <Text>{choice.label}</Text>}
                        style={{ width: undefined, padding: 8 }}
                    />
                ))}
            </ToggleButton.Row>
            <HelperText name={name} hint={hint} />
        </View>
    );
}

Toggle.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    hint: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object),
    style: PropTypes.object,
};
