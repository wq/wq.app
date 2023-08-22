import React from "react";
import { View } from "react-native";
import { RadioButton, List } from "react-native-paper";
import HelperText from "./HelperText.js";
import { useField } from "formik";
import PropTypes from "prop-types";

export default function Radio({ name, choices, label, hint }) {
    const [, { value }, { setValue }] = useField(name);
    return (
        <View>
            <List.Subheader>{label}</List.Subheader>
            <RadioButton.Group onValueChange={setValue} value={value}>
                {choices.map((choice) => (
                    <RadioButton.Item
                        key={choice.name}
                        value={choice.name}
                        label={choice.label}
                    />
                ))}
            </RadioButton.Group>
            <HelperText name={name} hint={hint} />
        </View>
    );
}

Radio.propTypes = {
    name: PropTypes.string,
    label: PropTypes.string,
    hint: PropTypes.string,
    choices: PropTypes.arrayOf(PropTypes.object),
};
