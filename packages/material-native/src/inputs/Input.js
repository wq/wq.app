import React from "react";
import { View } from "react-native";
import { TextInput } from "react-native-paper";
import { useField } from "formik";
import { useHtmlInput } from "@wq/react";
import HelperText from "./HelperText.js";
import PropTypes from "prop-types";

const keyboards = {
    int: "number-pad",
    decimal: "decimal-pad",
    tel: "phone-pad",
    email: "email-address",
};

export default function Input(props) {
    const { name, type, label, hint, style, min, max } = props,
        { maxLength } = useHtmlInput(props),
        [, meta, helpers] = useField(name),
        { value } = meta,
        { setValue, setTouched } = helpers;

    function handleChange(value) {
        if (type === "int" || type === "decimal") {
            if (type === "int") {
                value = parseInt(value);
            } else {
                value = +value;
            }
            if (Number.isNaN(value)) {
                setValue(null);
            } else {
                if (typeof min === "number" && value < min) {
                    value = min;
                }
                if (typeof max === "number" && value > max) {
                    value = max;
                }
                setValue(value);
            }
        } else {
            setValue(value);
        }
    }

    let formatValue;
    if (type === "int" || type === "decimal") {
        formatValue = typeof value === "number" ? "" + value : "";
    } else {
        formatValue = value;
    }

    return (
        <View style={{ flex: (style || {}).flex }}>
            <TextInput
                label={label}
                multiline={type === "text"}
                keyboardType={keyboards[type] || "default"}
                maxLength={maxLength}
                onChangeText={handleChange}
                onBlur={() => setTouched(true)}
                value={formatValue}
                style={style}
            />
            <HelperText name={name} hint={hint} />
        </View>
    );
}

Input.propTypes = {
    name: PropTypes.string,
    type: PropTypes.string,
    label: PropTypes.string,
    hint: PropTypes.string,
    style: PropTypes.object,
    min: PropTypes.number,
    max: PropTypes.number,
};
