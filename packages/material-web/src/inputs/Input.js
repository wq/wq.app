import React from "react";
import { Field } from "formik";
import { TextField } from "formik-mui";
import { useHtmlInput } from "@wq/react";
import PropTypes from "prop-types";

export default function Input({ hint, inputProps, ...rest }) {
    const { name, type, maxLength } = useHtmlInput(rest);
    return (
        <Field
            name={name}
            fullWidth
            margin="dense"
            component={TextField}
            helperText={hint}
            inputProps={{ maxLength, ...inputProps }}
            {...rest}
            type={type}
        />
    );
}

Input.propTypes = {
    name: PropTypes.string,
    hint: PropTypes.string,
    inputProps: PropTypes.object,
};
