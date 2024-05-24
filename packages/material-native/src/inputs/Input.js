import React, { useState } from "react";
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
    const { name, type, label, hint, style, min, max, step } = props,
        { maxLength } = useHtmlInput(props),
        [, meta, helpers] = useField(name),
        { value } = meta,
        [formatValue, setFormatValue] = useState(
            type === "int" || type === "decimal"
                ? typeof value === "number"
                    ? "" + value
                    : ""
                : value
        ),
        { setValue, setTouched } = helpers,
        [decimal, setDecimal] = useState();

    function handleChange(nextValue) {
        let value = nextValue;
        if (type === "int" || type === "decimal") {
            if (type === "int") {
                value = parseInt(value);
            } else {
                value = +value;
            }
            if (Number.isNaN(value)) {
                setValue(null);
                setFormatValue("");
            } else {
                if (typeof min === "number" && value < min) {
                    value = min;
                }
                if (typeof max === "number" && value > max) {
                    value = max;
                }
                if (step) {
                    value = +(Math.round(value / step) * step).toFixed(
                        step < 1 ? step.toString().split(".")[1].length : 0
                    );
                }
                setValue(value);
                setFormatValue(
                    +nextValue === value ? nextValue : value.toString()
                );
            }
        } else {
            setValue(value);
            setFormatValue(value);
        }
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
