import React from "react";
import { useField } from "formik";
import FormHelperText from "@mui/material/FormHelperText";

export default function FormError(props) {
    const [, { error }] = useField("__other__");
    if (!error) {
        return null;
    }
    return (
        <FormHelperText error {...props}>
            {error}
        </FormHelperText>
    );
}
