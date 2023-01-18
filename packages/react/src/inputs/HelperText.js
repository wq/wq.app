import React from "react";
import { useFormikContext, getIn } from "formik";
import PropTypes from "prop-types";

export default function HelperText({ name, hint }) {
    const { errors, touched } = useFormikContext(),
        error = getIn(errors, name),
        showError = !!error && !!getIn(touched, name);

    if (showError) {
        hint = error;
    }

    if (!hint) {
        return null;
    }

    return <p style={showError && { color: "red" }}>{hint}</p>;
}

HelperText.propTypes = {
    name: PropTypes.string,
    hint: PropTypes.string,
};
